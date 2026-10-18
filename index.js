const { Client, GatewayIntentBits, AutoModerationRuleTriggerType, AutoModerationRuleEventType, AutoModerationActionType, DiscordAPIError } = require('discord.js');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildAutoModerationConfiguration]
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function askQuestion(query) {
    return new Promise((resolve) => rl.question(query, resolve));
}

async function start() {
    console.clear();
    const token = await askQuestion('enter token: ');
    if (!token || !token.trim()) {
        console.log('token cannot be empty!');
        rl.close();
        return;
    }
    try {
        console.log('logging in...');
        await client.login(token.trim());
    } catch (e) {
        if (e instanceof DiscordAPIError && (e.code === 4004 || e.status === 401)) {
            console.error('invalid token!');
        } else {
            console.error('failed to login:', e.message);
        }
        rl.close();
        process.exit(1);
    }
    console.log(`logged in as ${client.user.tag}`);
    const guilds = await client.guilds.fetch();
    const totalGuilds = guilds.size;
    console.log(`bot is in ${totalGuilds} guilds`);
    if (totalGuilds < 12) {
        console.error(`need at least 12 guilds, currently only in ${totalGuilds}. invite it to more dummy servers first`);
        client.destroy();
        rl.close();
        process.exit(1);
    }
    console.log('\nthis will delete all automod rules across all servers and remake them. make sure these are dummy servers.');
    const confirm = await askQuestion('type y/n to continue: ');
    if (confirm.toLowerCase() !== 'y') {
        console.log('canceled');
        client.destroy();
        rl.close();
        process.exit(0);
    }
    console.log('\nstarting the script...');
    console.log('doing this sequentially so discord won\'t rate limit us\n');
    
    let totalRulesCreatedOverall = 0;
    
    for (const [guildId, simpleGuild] of guilds) {
        try {
            const guild = await simpleGuild.fetch();
            console.log(`\nprocessing ${guild.name}`);
            const existingRules = await guild.autoModerationRules.fetch();
            if (existingRules.size > 0) {
                console.log(`  cleaning up ${existingRules.size} old rules...`);
                for (const [, rule] of existingRules) {
                    await rule.delete('huyyy diga dafee weryonti, muy chappa chappa [vat] [vat] TEEGARA [vat] vat ke');
                    await delay(500);
                }
            }
            const createdCount = await processGuildRules(guild);
            totalRulesCreatedOverall += createdCount;
            console.log(`  created ${createdCount} rules in ${guild.name}`);
        } catch (e) {
            if (e instanceof DiscordAPIError && e.code === 50013) {
                console.log(`  missing permissions in ${simpleGuild.name}, skipping...`);
            } else {
                console.error(`  failed processing ${simpleGuild.name}:`, e.message);
            }
        }
        await delay(1000);
    }
    console.log(`\nsuccessfully created ${totalRulesCreatedOverall} rules`);
    console.log('now you\'ll need to wait for 24h for the badge to appear on your bot\'s profile');
    console.log(`cheers!`);
    
    client.destroy();
    rl.close();
    process.exit(0);
}

async function processGuildRules(guild) {
    let created = 0;
    const ruleConfigurations = [
        { name: 'auto_mod_1', triggerType: AutoModerationRuleTriggerType.Keyword, metadata: { keywordFilter: ['test1', 'test2'] } },
        { name: 'auto_mod_2', triggerType: AutoModerationRuleTriggerType.Keyword, metadata: { keywordFilter: ['test3', 'test4'] } },
        { name: 'auto_mod_3', triggerType: AutoModerationRuleTriggerType.Keyword, metadata: { keywordFilter: ['test5', 'test6'] } },
        { name: 'auto_mod_4', triggerType: AutoModerationRuleTriggerType.Keyword, metadata: { keywordFilter: ['test7', 'test8'] } },
        { name: 'auto_mod_5', triggerType: AutoModerationRuleTriggerType.Keyword, metadata: { keywordFilter: ['test9', 'test10'] } },
        { name: 'auto_mod_6', triggerType: AutoModerationRuleTriggerType.Keyword, metadata: { keywordFilter: ['test11', 'test12'] } },
        { name: 'auto_mod_spam', triggerType: AutoModerationRuleTriggerType.Spam, metadata: {} },
        { name: 'auto_mod_preset', triggerType: AutoModerationRuleTriggerType.KeywordPreset, metadata: { presets: [1, 2, 3] } },
        { name: 'auto_mod_mention', triggerType: AutoModerationRuleTriggerType.MentionSpam, metadata: { mentionTotalLimit: 3, mentionRaidProtectionEnabled: true } }
    ];
    for (const config of ruleConfigurations) {
        try {
            await guild.autoModerationRules.create({
                name: config.name,
                enabled: false,
                eventType: AutoModerationRuleEventType.MessageSend,
                triggerType: config.triggerType,
                triggerMetadata: config.metadata,
                actions: [{ type: AutoModerationActionType.BlockMessage }],
                reason: 'huyyy diga dafee weryonti, muy chappa chappa [vat] [vat] TEEGARA [vat] vat ke'
            });
            created++;
            await delay(600);
        } catch (e) {
            if (e instanceof DiscordAPIError && (e.code === 30060 || e.code === 30038)) {
                continue;
            }
            throw e;
        }
    }
    return created;
}

start();