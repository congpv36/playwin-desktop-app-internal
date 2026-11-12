const accountSchema = `
        id TEXT PRIMARY KEY NOT NULL,

        orderID INTEGER,
        winBetsCount INTEGER,
        autoLoginAttempts INTEGER DEFAULT 0,

        loginID TEXT,
        password TEXT,
        secret TEXT,

        limitMethod TEXT,
        livePreGame INTEGER,
        limitType TEXT,
        totalAmount TEXT,
        totalCount TEXT,


        platformName TEXT,
        loginURL TEXT,

        currency TEXT,
        cashBalance TEXT,
        outstanding TEXT,
        credit TEXT,
        givenCredit TEXT,

        textLog TEXT,

        customIP TEXT,
        proxyIP TEXT,
        proxyPort TEXT,
        proxyUsername TEXT,
        proxyPassword TEXT,
        proxyScope TEXT,

        typeCrawl TEXT,

        checkBoxBet INTEGER,
        checkBoxRefresh INTEGER,
        checkBoxAutoLogin INTEGER,
        checkBoxLockURL INTEGER,

        status TEXT,
        statusPair INTEGER,
        statusLogin TEXT,
        statusDelete INTEGER,

        token TEXT,
        hdToken TEXT,
        
        cookie TEXT,
        vHucode TEXT,
        host TEXT,
        socketUrl TEXT,
        parent_id TEXT,
        uid TEXT
      `

export default accountSchema
