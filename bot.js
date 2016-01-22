if (!process.env.token) {
  console.log('Error: Specify token in environment');
  process.exit(1);
}

var Botkit = require('./lib/Botkit.js');
var os = require('os');
var http = require('http');

var controller = Botkit.slackbot({
  debug: false,
});

var bot = controller.spawn({
  token: process.env.token
});


var constants = {
  shoutoutUser: '',
  helpUser: '',
  ownerData: {
    name: 'Avi Samloff',
    email: 'avi.samloff@gmail.com',
    phone: '(804) 432-2662'
  },
  passcode: 'Mak3rSquar3',
};

var userList = {};
var channelList = {};

bot.startRTM(function(err,bot,payload) {
  if (err) {
    throw new Error('Could not connect to Slack');
  }
  for (var i = 0; i < payload.channels.length; i++) {
    // console.log('name: ' + payload.channels[i].name + ' id: ' + payload.channels[i].id);
    channelList[payload.channels[i].name] = payload.channels[i].id;
  }
  for(var j = 0; j < payload.users.length; j++) {
    // console.log(payload.users[i].name);
    userList[payload.users[j].name] = payload.users[j].id;
  }
  console.log('channelList:\n', channelList);
  console.log('userList:\n', userList);
});

/*************************************/
/************** Commands *************/
/*************************************/

controller.hears(['%hi'], 'direct_message,direct_mention,mention', function(bot, message) {
  bot.api.reactions.add({
    timestamp: message.ts,
    channel: message.channel,
    name: 'robot_face',
  }, function(err, res) {
    if (err) {
      bot.botkit.log('Failed to add emoji reaction :(', err);
    }
  });
});

//shutdown handler
controller.hears(['%shutdown'], 'direct_message', function(bot, message) {

  bot.startConversation(message, function(err, convo) {
    convo.ask('WHAT\'S THE PASSCODE?!', [{
      pattern: constants.passcode,
      callback: function(response, convo) {
        convo.say('Bye!');
        convo.next();
        setTimeout(function() {
          process.exit();
        }, 3000);
      }
    }, {
      default: true,
      callback: function(response, convo) {
        convo.say('Wrong. Please contact my controller, ' + constants.ownerData.name + ' at ' + constants.ownerData.email + ' or ' + constants.ownerData.phone + ' for help.');
        convo.next();
      }
    }]);
  });
});

//uptime handler
controller.hears(['%uptime'], 'direct_message', function(bot, message) {

  var hostname = os.hostname();
  var uptime = formatUptime(process.uptime());

  bot.reply(message, 'My name is ' + bot.identity.name + ', and I have been running for ' + uptime + ' on ' + hostname + '.');

});


//help handler
controller.hears(['%help'], 'direct_message,direct_mention,mention,ambient', function(bot, message) {
  bot.startPrivateConversation(message, function(err, convo) {
    convo.ask('I heard that you need some help! [Yes/No]', [{
      pattern: bot.utterances.yes,
      callback: function(response, convo) {
        convo.say('I\'ll let the fellows know! Beep boop.');
        constants.helpUser = getNameFromID(message.user);
        bot.say({
          text: constants.helpUser + ' needs help!',
          channel: 'C0JD33GA3' //fellows channel
        });
        convo.next();
      }
    }, {
      pattern: bot.utterances.no,
      default: true,
      callback: function(response, convo) {
        convo.say('Okay! Keep working, I\'m sure you\'re doing great! :simple_smile:');
        convo.next();
      }
    }]);
  });
});


//shoutout handler
controller.hears(['%shoutout (.*)'], 'direct_message', function(bot, message) {
  constants.shoutoutUser = message.match[1];
  bot.startConversation(message, askShoutout);
});

//commands handler
controller.hears(['%commands', '%cmd', '%command'], 'direct_message,direct_mention,mention,ambient', function(bot, message) {
  bot.reply(message, 'Available commands are:\n*%help* - ping the fellows for help\n*%shoutout [name]* - anonymously give someone a shoutout!\n*%uptime* - see how long I\'ve been beeping and booping\n*%shutdown* - shutdown my server for debugging');
});



/*************************************/
/************* Functions *************/
/*************************************/

function formatUptime(uptime) {
  var unit = 'second';
  if (uptime > 60) {
    uptime = uptime / 60;
    unit = 'minute';
  }
  if (uptime > 60) {
    uptime = uptime / 60;
    unit = 'hour';
  }
  if (uptime != 1) {
    unit = unit + 's';
  }

  uptime = uptime + ' ' + unit;
  return uptime;
}

function askShoutout(response, convo) {
  convo.ask('What do you want me to tell ' + constants.shoutoutUser + '?', function(response, convo) {
    convo.say('Okay! I\'ll tell him you said that!');
    convo.next();
  });
}

function getNameFromID(userID) {
  for (var key in userList) {
    if (userList[key] === userID) {
      return key;
    }
  }
  return 'Someone';
}

/*************************************/
/*********** Event Handlers **********/
/*************************************/

controller.on('tick', function(bot, message) {});

controller.on('hello', function(bot, message) {});
