require('dotenv').config();

const eris = require('eris');
const webhookListener = require('./server.js');
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;
const ROLE_NAME = process.env.ROLE_NAME;
const ROLE_REMOVE = process.env.ROLE_REMOVE;
const bot = new eris.Client(process.env.DISCORD_API_TOKEN);

async function updateMemberRoleForVerification(guild, member) {
  // If the user is verified on verify.airforcegaming.com they will be granted verified role.

  //wants ID number not name for some reason
  if (guild && member) {
    // Get the role, or if it doesn't exist, create it.
    let roleAdd = Array.from(guild.roles.values())
      .find(role => role.name === ROLE_NAME);

    let roleRemove = Array.from(guild.roles.values())
      .find(role => role.name === ROLE_REMOVE);

    // Add the role to the user, along with an explanation
    // for the guild log (the "audit log").
    member.addRole(roleAdd.id, 'Verified with Air Force Gaming!');
    member.removeRole(roleRemove.id, 'Verified with Air Force Gaming!');

    return;
  }
}

function findUserInString(str) {
  const lowercaseStr = str.toLowerCase();
  // Look for a username in the form of username#discriminator.
  const user = bot.users.find(
    user => lowercaseStr.indexOf(`${user.username.toLowerCase()}#${user.discriminator}`) !== -1,
  );
  return user;
}

function logVerification(member, email, realName) {
  const isKnownMember = !!member;
  const memberName = isKnownMember ? `${member.username}#${member.discriminator}` : 'Unknown';
  const embedColor = isKnownMember ? 0x00ff00 : 0xff0000;
  let timestamp = new Date();
  
  timestamp = timestamp.toISOString();

  const logMessage = {
    embed: {
      title: 'Verification processed',
      color: embedColor,
      timestamp: timestamp,
      fields: [
        { name: 'Email', value: email, inline: true },
        { name: 'User\'s Real Name' , value: realName, inline: true },
        { name: 'Discord name', value: memberName, inline: true },
       
      ],
    }
  }

  bot.createMessage(LOG_CHANNEL_ID, logMessage);
}

async function onVerify(
  email,
  realName,
  discName,
) {
  try {
    const user = findUserInString(discName);
    const guild = user ? bot.guilds.find(guild => guild.members.has(user.id)) : null;
    const guildMember = guild ? guild.members.get(user.id) : null;

    return await Promise.all([
      updateMemberRoleForVerification(guild, guildMember),
      logVerification(guildMember, email, realName, discName),
    ]);
  } catch (err) {
    console.warn('Error updating verify role and logging verification');
    console.warn(err);
  }
}

webhookListener.on('verification', onVerify);

bot.connect();

bot.on('error', err => {
  console.warn(err);
});

//Public functions
const test = () => {
    console.log('Connection to bot.js solid!');

}

//module.exports = bot;
exports.test = test;