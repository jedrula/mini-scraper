const Slack = require('slack-node');
const webhookUri = 'https://hooks.slack.com/services/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';

const slack = new Slack();
slack.setWebhook(webhookUri);

function postMessageToSlack(text) {
  slack.webhook({
    channel: "#general",
    username: "robot jedrka",
    text
  }, function(err, response) {
    console.log(response);
  });
}

const scraper = require('./scrapers/de/index');

scraper.start({
  onDiff(diff) {
    console.log('onDiff called', diff)
    if(diff.added) {
      postMessageToSlack(diff.added.message);
    }
  }
})
