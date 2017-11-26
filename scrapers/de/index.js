// mobile.de:
// https://suchen.mobile.de/fahrzeuge/search.html?ambitAddress=02826%2C+G%C3%B6rlitz%2C+Sachsen&ambitCountry=DE&damageUnrepaired=NO_DAMAGE_UNREPAIRED&fuels=DIESEL&isSearchRequest=true&makeModelVariant1.makeId=17500&maxMileage=150000&maxPrice=11000&minPowerAsArray=74&minPowerAsArray=KW&pageNumber=2&scopeId=C&userPosition=51.1481975%2C14.9754089&zipcodeRadius=200
const request = require('request');
const LocalStorage = require('node-localstorage').LocalStorage;;
const localStorage = new LocalStorage('./mini-scraper');
const maxPrice = 12000;
const url = `https://gebrauchtwagen.mini.de/api/vehicles?culture=en-GB&fuelling=4&horsepowermin=101&orderby=Price&orderdir=asc&ordertype=list&pricemax=${maxPrice}&skip=0&take=50&variants=117&variants=115`;
// const url = 'https://gebrauchtwagen.mini.de/api/vehicles?culture=en-GB&orderby=Price&orderdir=asc&ordertype=list&skip=10&take=10&variants=115&vatdeductible=true'
function getDiff(newItems, lastItems = []) {
  const newVins = newItems.map(item => item.vin);
  const oldVins = lastItems.map(item => item.vin);
  const addedVin = newVins.find(newVin => oldVins.indexOf(newVin) === -1);
  console.log('addedVin', addedVin);
  if(addedVin) {
    const newItem = newItems.find(x => x.vin === addedVin);

    const {
      id,
      mediaItems: [ { downloadUrl } ],
      consumerPrice: {
        totalPrice,
        vatDeductible
      },
      availableFrom: {
        dateString
      }
    } = newItem;

    const url = `https://gebrauchtwagen.mini.de/#/details/${id}`;
    let price;
    let plPrice;
    const euroInPln = 4.21;
    if(vatDeductible) {
      const vatRateDe = 0.19;
      const vatRatePl = 0.23;
      const akcyza = 0.031;
      const netto = totalPrice / (1+vatRateDe);
      plPrice = netto * (1 + akcyza) * (1 + vatRatePl * 0.5) * euroInPln;
      price = `brutto: ${totalPrice} EUR netto: ${netto} EUR (cena w PL po dodaniu 50% vat)`;
    } else {
      price = totalPrice;
      plPrice = totalPrice * euroInPln;
    }
    const messages = [`nowy vin: ${addedVin}`, downloadUrl, url, `cena niemcy: ${price}`, `cena PL: ${plPrice} PLN`, dateString];

    const message = messages.join('\n');
    console.log(message);
    return {
      added: {
        message
      }
    }
  }
}


const tenMinutes = 1000 * 60 * 10;
const twentyMinutes = 2 * tenMinutes;

const interval = twentyMinutes;

const checkChanges = (onDiff) => {
  console.log('requesting');
  request(url, function(error, response, body) {
    const lastBody = localStorage.getItem('de-body') || "{}";
    const diff = getDiff(JSON.parse(body).items, JSON.parse(lastBody).items);
    if(diff) {
      localStorage.setItem('de-body', body);
      onDiff(diff);
    }
    const change = diff ? 'changed' : 'not changed';
    const msg = `last check on ${new Date()}, list of cars with paxPrice=${maxPrice} has ${change}`;
    console.log(msg);
    localStorage.setItem('de-body-last-check', msg);
  })
}

function start({ onDiff }) {
  checkChanges(onDiff);
  setInterval(checkChanges.bind(null, onDiff), interval)
}

module.exports = {
  start,
}
