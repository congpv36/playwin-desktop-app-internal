const sportsBookSchema = `
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        platform TEXT NOT NULL,
        url TEXT NOT NULL,
        isPaired INTEGER,

        betAmountSetting TEXT NOT NULL,
        betFixedAmountValue TEXT NOT NULL,

        isSwitchBySuccessCount INTEGER,
        minSuccessCount TEXT NOT NULL,
        maxSuccessCount TEXT NOT NULL,

        isSwitchByCredit INTEGER,
        maxCredit TEXT NOT NULL,

        isRandomDelayLogin INTEGER NOT NULL DEFAULT 0,
        minDelayLogin TEXT NOT NULL DEFAULT '1',
        maxDelayLogin TEXT NOT NULL DEFAULT '10',

        delayNormal TEXT,
        delaySameGame TEXT,
        suggestedClient TEXT,
        delayLoginSec_from TEXT,
        delayLoginSec_to TEXT,
        switchIntervalSetting_from TEXT,
        switchIntervalSetting_to TEXT,
        switchIntervalSettingMinutes TEXT,
        accountType TEXT,
        switchAccountSetting TEXT,
        hight_account TEXT,
        VIPAccountLogout INTEGER,

        valueRange INTEGER,

        isMatchLimitAllAccount INTEGER NOT NULL,
        limitMethod TEXT NOT NULL,
        limitType TEXT NOT NULL,
        totalAmount TEXT NOT NULL,
        totalCount TEXT NOT NULL,

        lockURL INTEGER NOT NULL DEFAULT 0
      `

export default sportsBookSchema
