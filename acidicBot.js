(function() {

    API.getWaitListPosition = function(id) {
        if (typeof id === 'undefined' || id === null) {
            id = API.getUser().id;
        }
        var wl = API.getWaitList();
        for (var i = 0; i < wl.length; i++) {
            if (wl[i].id === id) {
                return i;
            }
        }
        return -1;
    };

    var kill = function() {
        clearInterval(acidicBot.room.autodisableInterval);
        clearInterval(acidicBot.room.afkInterval);
        acidicBot.status = false;
    };

    var socket = function() {
        function loadSocket() {
            SockJS.prototype.msg = function(a) {
                this.send(JSON.stringify(a))
            };
            sock = new SockJS('https://socket-bnzi.c9.io/basicbot');
            sock.onopen = function() {
                console.log('[acidicBot v2.5.6] Connected to socket!');
                sendToSocket();
            };
            sock.onclose = function() {
                console.log('[acidicBot v2.5.6] Disconnected from socket!');
                var reconnect = setTimeout(function(){ loadSocket() }, 60 * 1000);
            };
            sock.onmessage = function(broadcast) {
                var rawBroadcast = broadcast.data;
                var broadcastMessage = rawBroadcast.replace(/["\\]+/g, '');
                API.chatLog(broadcastMessage);
                console.log(broadcastMessage);
            };
        }
        if (typeof SockJS == 'undefined') {
            $.getScript('https://cdn.jsdelivr.net/sockjs/0.3.4/sockjs.min.js', loadSocket);
        } else loadSocket();
    }

    var sendToSocket = function() {
        var acidicBotSettings = acidicBot.settings;
        var acidicBotRoom = acidicBot.room;
        var acidicBotInfo = {
            time: Date.now(),
            version: acidicBot.version
        };
        var data = {
            users: API.getUsers(),
            userinfo: API.getUser(),
            room: location.pathname,
            acidicBotSettings: acidicBotSettings,
            acidicBotRoom: acidicBotRoom,
            acidicBotInfo: acidicBotInfo
        };
        return sock.msg(data);
    };

    var storeToStorage = function() {
        localStorage.setItem("acidicBotsettings", JSON.stringify(acidicBot.settings));
        localStorage.setItem("acidicBotRoom", JSON.stringify(acidicBot.room));
        var acidicBotStorageInfo = {
            time: Date.now(),
            stored: true,
            version: acidicBot.version
        };
        localStorage.setItem("acidicBotStorageInfo", JSON.stringify(acidicBotStorageInfo));

    };

    var subChat = function(chat, obj) {
        if (typeof chat === "undefined") {
            API.chatLog("There is a chat text missing.");
            console.log("There is a chat text missing.");
            return "[Error] No text message found.";
        }
        var lit = '%%';
        for (var prop in obj) {
            chat = chat.replace(lit + prop.toUpperCase() + lit, obj[prop]);
        }
        return chat;
    };

    var loadChat = function(cb) {
        if (!cb) cb = function() {};
        $.get("https://rawgit.com/Yemasthui/basicBot/master/lang/langIndex.json", function(json) {
            var link = acidicBot.chatLink;
            if (json !== null && typeof json !== "undefined") {
                langIndex = json;
                link = langIndex[acidicBot.settings.language.toLowerCase()];
                if (acidicBot.settings.chatLink !== acidicBot.chatLink) {
                    link = acidicBot.settings.chatLink;
                } else {
                    if (typeof link === "undefined") {
                        link = acidicBot.chatLink;
                    }
                }
                $.get(link, function(json) {
                    if (json !== null && typeof json !== "undefined") {
                        if (typeof json === "string") json = JSON.parse(json);
                        acidicBot.chat = json;
                        cb();
                    }
                });
            } else {
                $.get(acidicBot.chatLink, function(json) {
                    if (json !== null && typeof json !== "undefined") {
                        if (typeof json === "string") json = JSON.parse(json);
                        acidicBot.chat = json;
                        cb();
                    }
                });
            }
        });
    };

    var retrieveSettings = function() {
        var settings = JSON.parse(localStorage.getItem("acidicBotsettings"));
        if (settings !== null) {
            for (var prop in settings) {
                acidicBot.settings[prop] = settings[prop];
            }
        }
    };

    var retrieveFromStorage = function() {
        var info = localStorage.getItem("acidicBotStorageInfo");
        if (info === null) API.chatLog(acidicBot.chat.nodatafound);
        else {
            var settings = JSON.parse(localStorage.getItem("acidicBotsettings"));
            var room = JSON.parse(localStorage.getItem("acidicBotRoom"));
            var elapsed = Date.now() - JSON.parse(info).time;
            if ((elapsed < 1 * 60 * 60 * 1000)) {
                API.chatLog(acidicBot.chat.retrievingdata);
                for (var prop in settings) {
                    acidicBot.settings[prop] = settings[prop];
                }
                acidicBot.room.users = room.users;
                acidicBot.room.afkList = room.afkList;
                acidicBot.room.historyList = room.historyList;
                acidicBot.room.mutedUsers = room.mutedUsers;
                acidicBot.room.autoskip = room.autoskip;
                acidicBot.room.roomstats = room.roomstats;
                acidicBot.room.messages = room.messages;
                acidicBot.room.queue = room.queue;
                acidicBot.room.newBlacklisted = room.newBlacklisted;
                API.chatLog(acidicBot.chat.datarestored);
            }
        }
        var json_sett = null;
        var roominfo = document.getElementById("room-settings");
        info = roominfo.textContent;
        var ref_bot = "@acidicBot=";
        var ind_ref = info.indexOf(ref_bot);
        if (ind_ref > 0) {
            var link = info.substring(ind_ref + ref_bot.length, info.length);
            var ind_space = null;
            if (link.indexOf(" ") < link.indexOf("\n")) ind_space = link.indexOf(" ");
            else ind_space = link.indexOf("\n");
            link = link.substring(0, ind_space);
            $.get(link, function(json) {
                if (json !== null && typeof json !== "undefined") {
                    json_sett = JSON.parse(json);
                    for (var prop in json_sett) {
                        acidicBot.settings[prop] = json_sett[prop];
                    }
                }
            });
        }

    };

    String.prototype.splitBetween = function(a, b) {
        var self = this;
        self = this.split(a);
        for (var i = 0; i < self.length; i++) {
            self[i] = self[i].split(b);
        }
        var arr = [];
        for (var i = 0; i < self.length; i++) {
            if (Array.isArray(self[i])) {
                for (var j = 0; j < self[i].length; j++) {
                    arr.push(self[i][j]);
                }
            } else arr.push(self[i]);
        }
        return arr;
    };

    String.prototype.startsWith = function(str) {
        return this.substring(0, str.length) === str;
    };

    var linkFixer = function(msg) {
        var parts = msg.splitBetween('<a href="', '<\/a>');
        for (var i = 1; i < parts.length; i = i + 2) {
            var link = parts[i].split('"')[0];
            parts[i] = link;
        }
        var m = '';
        for (var i = 0; i < parts.length; i++) {
            m += parts[i];
        }
        return m;
    };

    var decodeEntities = function(s) {
        var str, temp = document.createElement('p');
        temp.innerHTML = s;
        str = temp.textContent || temp.innerText;
        temp = null;
        return str;
    };

    var botCreator = "Benzi (Quoona)";
    var botMaintainer = "Ronit Sajeey (LaishaBear)"
    var botCreatorIDs = ["4811741"];

    var acidicBot = {
        version: "2.5.6",
        status: false,
        name: "acidicBot",
        loggedInID: null,
        scriptLink: null,
        cmdLink: null,
        chatLink: "https://rawgit.com/Yemasthui/basicBot/master/lang/en.json",
        chat: null,
        loadChat: loadChat,
        retrieveSettings: retrieveSettings,
        retrieveFromStorage: retrieveFromStorage,
        settings: {
            botName: "acidicBot",
            language: "english",
            chatLink: "https://rawgit.com/Yemasthui/basicBot/master/lang/en.json",
            startupCap: 1,
            startupVolume: 0,
            startupEmoji: false,
            cmdDeletion: true,
            maximumAfk: 120,
            afkRemoval: true,
            maximumDc: 60,
            bouncerPlus: true,
            blacklistEnabled: true,
            lockdownEnabled: false,
            lockGuard: false,
            maximumLocktime: 10,
            cycleGuard: true,
            maximumCycletime: 10,
            voteSkip: false,
            voteSkipLimit: 10,
            historySkip: false,
            timeGuard: true,
            maximumSongLength: 10,
            autodisable: true,
            commandCooldown: 30,
            usercommandsEnabled: true,
            lockskipPosition: 3,
            lockskipReasons: [
                ["theme", "This song does not fit the room theme. "],
                ["op", "This song is on the OP list. "],
                ["history", "This song is in the history. "],
                ["mix", "You played a mix, which is against the rules. "],
                ["sound", "The song you played had bad sound quality or no sound. "],
                ["nsfw", "The song you contained was NSFW (image or sound). "],
                ["unavailable", "The song you played was not available for some users. "]
            ],
            afkpositionCheck: 15,
            afkRankCheck: "ambassador",
            motdEnabled: false,
            motdInterval: 5,
            motd: null,
            filterChat: true,
            etaRestriction: false,
            welcome: true,
            opLink: null,
            rulesLink: null,
            themeLink: null,
            fbLink: null,
            youtubeLink: null,
            website: null,
            intervalMessages: [],
            messageInterval: 5,
            songstats: true,
            commandLiteral: "!",
            blacklists: {
                NSFW: "",
                OP: ""
            }
        },
        room: {
            users: [],
            afkList: [],
            mutedUsers: [],
            bannedUsers: [],
            skippable: true,
            usercommand: true,
            allcommand: true,
            afkInterval: null,
            autoskip: false,
            autoskipTimer: null,
            autodisableInterval: null,
            autodisableFunc: function() {
                if (acidicBot.status && acidicBot.settings.autodisable) {
                    API.sendChat('!afkdisable');
                    API.sendChat('!joindisable');
                }
            },
            queueing: 0,
            queueable: true,
            currentDJID: null,
            historyList: [],
            cycleTimer: setTimeout(function() {}, 1),
            roomstats: {
                accountName: null,
                totalWoots: 0,
                totalCurates: 0,
                totalMehs: 0,
                launchTime: null,
                songCount: 0,
                chatmessages: 0
            },
            messages: {
                from: [],
                to: [],
                message: []
            },
            queue: {
                id: [],
                position: []
            },
            blacklists: {

            },
            newBlacklisted: [],
            newBlacklistedSongFunction: null,
            roulette: {
                rouletteStatus: false,
                participants: [],
                countdown: null,
                startRoulette: function() {
                    acidicBot.room.roulette.rouletteStatus = true;
                    acidicBot.room.roulette.countdown = setTimeout(function() {
                        acidicBot.room.roulette.endRoulette();
                    }, 60 * 1000);
                    API.sendChat(acidicBot.chat.isopen);
                },
                endRoulette: function() {
                    acidicBot.room.roulette.rouletteStatus = false;
                    var ind = Math.floor(Math.random() * acidicBot.room.roulette.participants.length);
                    var winner = acidicBot.room.roulette.participants[ind];
                    acidicBot.room.roulette.participants = [];
                    var pos = Math.floor((Math.random() * API.getWaitList().length) + 1);
                    var user = acidicBot.userUtilities.lookupUser(winner);
                    var name = user.username;
                    API.sendChat(subChat(acidicBot.chat.winnerpicked, {
                        name: name,
                        position: pos
                    }));
                    setTimeout(function(winner, pos) {
                        acidicBot.userUtilities.moveUser(winner, pos, false);
                    }, 1 * 1000, winner, pos);
                }
            }
        },
        User: function(id, name) {
            this.id = id;
            this.username = name;
            this.jointime = Date.now();
            this.lastActivity = Date.now();
            this.votes = {
                woot: 0,
                meh: 0,
                curate: 0
            };
            this.lastEta = null;
            this.afkWarningCount = 0;
            this.afkCountdown = null;
            this.inRoom = true;
            this.isMuted = false;
            this.lastDC = {
                time: null,
                position: null,
                songCount: 0
            };
            this.lastKnownPosition = null;
        },
        userUtilities: {
            getJointime: function(user) {
                return user.jointime;
            },
            getUser: function(user) {
                return API.getUser(user.id);
            },
            updatePosition: function(user, newPos) {
                user.lastKnownPosition = newPos;
            },
            updateDC: function(user) {
                user.lastDC.time = Date.now();
                user.lastDC.position = user.lastKnownPosition;
                user.lastDC.songCount = acidicBot.room.roomstats.songCount;
            },
            setLastActivity: function(user) {
                user.lastActivity = Date.now();
                user.afkWarningCount = 0;
                clearTimeout(user.afkCountdown);
            },
            getLastActivity: function(user) {
                return user.lastActivity;
            },
            getWarningCount: function(user) {
                return user.afkWarningCount;
            },
            setWarningCount: function(user, value) {
                user.afkWarningCount = value;
            },
            lookupUser: function(id) {
                for (var i = 0; i < acidicBot.room.users.length; i++) {
                    if (acidicBot.room.users[i].id === id) {
                        return acidicBot.room.users[i];
                    }
                }
                return false;
            },
            lookupUserName: function(name) {
                for (var i = 0; i < acidicBot.room.users.length; i++) {
                    var match = acidicBot.room.users[i].username.trim() == name.trim();
                    if (match) {
                        return acidicBot.room.users[i];
                    }
                }
                return false;
            },
            voteRatio: function(id) {
                var user = acidicBot.userUtilities.lookupUser(id);
                var votes = user.votes;
                if (votes.meh === 0) votes.ratio = 1;
                else votes.ratio = (votes.woot / votes.meh).toFixed(2);
                return votes;

            },
            getPermission: function(obj) {
                var u;
                if (typeof obj === "object") u = obj;
                else u = API.getUser(obj);
                for (var i = 0; i < botCreatorIDs.length; i++) {
                    if (botCreatorIDs[i].indexOf(u.id) > -1) return 10;
                }
                if (u.gRole < 2) return u.role;
                else {
                    switch (u.gRole) {
                        case 2:
                            return 7;
                        case 3:
                            return 8;
                        case 4:
                            return 9;
                        case 5:
                            return 10;
                    }
                }
                return 0;
            },
            moveUser: function(id, pos, priority) {
                var user = acidicBot.userUtilities.lookupUser(id);
                var wlist = API.getWaitList();
                if (API.getWaitListPosition(id) === -1) {
                    if (wlist.length < 50) {
                        API.moderateAddDJ(id);
                        if (pos !== 0) setTimeout(function(id, pos) {
                            API.moderateMoveDJ(id, pos);
                        }, 1250, id, pos);
                    } else {
                        var alreadyQueued = -1;
                        for (var i = 0; i < acidicBot.room.queue.id.length; i++) {
                            if (acidicBot.room.queue.id[i] === id) alreadyQueued = i;
                        }
                        if (alreadyQueued !== -1) {
                            acidicBot.room.queue.position[alreadyQueued] = pos;
                            return API.sendChat(subChat(acidicBot.chat.alreadyadding, {
                                position: acidicBot.room.queue.position[alreadyQueued]
                            }));
                        }
                        acidicBot.roomUtilities.booth.lockBooth();
                        if (priority) {
                            acidicBot.room.queue.id.unshift(id);
                            acidicBot.room.queue.position.unshift(pos);
                        } else {
                            acidicBot.room.queue.id.push(id);
                            acidicBot.room.queue.position.push(pos);
                        }
                        var name = user.username;
                        return API.sendChat(subChat(acidicBot.chat.adding, {
                            name: name,
                            position: acidicBot.room.queue.position.length
                        }));
                    }
                } else API.moderateMoveDJ(id, pos);
            },
            dclookup: function(id) {
                var user = acidicBot.userUtilities.lookupUser(id);
                if (typeof user === 'boolean') return acidicBot.chat.usernotfound;
                var name = user.username;
                if (user.lastDC.time === null) return subChat(acidicBot.chat.notdisconnected, {
                    name: name
                });
                var dc = user.lastDC.time;
                var pos = user.lastDC.position;
                if (pos === null) return acidicBot.chat.noposition;
                var timeDc = Date.now() - dc;
                var validDC = false;
                if (acidicBot.settings.maximumDc * 60 * 1000 > timeDc) {
                    validDC = true;
                }
                var time = acidicBot.roomUtilities.msToStr(timeDc);
                if (!validDC) return (subChat(acidicBot.chat.toolongago, {
                    name: acidicBot.userUtilities.getUser(user).username,
                    time: time
                }));
                var songsPassed = acidicBot.room.roomstats.songCount - user.lastDC.songCount;
                var afksRemoved = 0;
                var afkList = acidicBot.room.afkList;
                for (var i = 0; i < afkList.length; i++) {
                    var timeAfk = afkList[i][1];
                    var posAfk = afkList[i][2];
                    if (dc < timeAfk && posAfk < pos) {
                        afksRemoved++;
                    }
                }
                var newPosition = user.lastDC.position - songsPassed - afksRemoved;
                if (newPosition <= 0) newPosition = 1;
                var msg = subChat(acidicBot.chat.valid, {
                    name: acidicBot.userUtilities.getUser(user).username,
                    time: time,
                    position: newPosition
                });
                acidicBot.userUtilities.moveUser(user.id, newPosition, true);
                return msg;
            }
        },

        roomUtilities: {
            rankToNumber: function(rankString) {
                var rankInt = null;
                switch (rankString) {
                    case "admin":
                        rankInt = 10;
                        break;
                    case "ambassador":
                        rankInt = 7;
                        break;
                    case "host":
                        rankInt = 5;
                        break;
                    case "cohost":
                        rankInt = 4;
                        break;
                    case "manager":
                        rankInt = 3;
                        break;
                    case "bouncer":
                        rankInt = 2;
                        break;
                    case "residentdj":
                        rankInt = 1;
                        break;
                    case "user":
                        rankInt = 0;
                        break;
                }
                return rankInt;
            },
            msToStr: function(msTime) {
                var ms, msg, timeAway;
                msg = '';
                timeAway = {
                    'days': 0,
                    'hours': 0,
                    'minutes': 0,
                    'seconds': 0
                };
                ms = {
                    'day': 24 * 60 * 60 * 1000,
                    'hour': 60 * 60 * 1000,
                    'minute': 60 * 1000,
                    'second': 1000
                };
                if (msTime > ms.day) {
                    timeAway.days = Math.floor(msTime / ms.day);
                    msTime = msTime % ms.day;
                }
                if (msTime > ms.hour) {
                    timeAway.hours = Math.floor(msTime / ms.hour);
                    msTime = msTime % ms.hour;
                }
                if (msTime > ms.minute) {
                    timeAway.minutes = Math.floor(msTime / ms.minute);
                    msTime = msTime % ms.minute;
                }
                if (msTime > ms.second) {
                    timeAway.seconds = Math.floor(msTime / ms.second);
                }
                if (timeAway.days !== 0) {
                    msg += timeAway.days.toString() + 'd';
                }
                if (timeAway.hours !== 0) {
                    msg += timeAway.hours.toString() + 'h';
                }
                if (timeAway.minutes !== 0) {
                    msg += timeAway.minutes.toString() + 'm';
                }
                if (timeAway.minutes < 1 && timeAway.hours < 1 && timeAway.days < 1) {
                    msg += timeAway.seconds.toString() + 's';
                }
                if (msg !== '') {
                    return msg;
                } else {
                    return false;
                }
            },
            booth: {
                lockTimer: setTimeout(function() {}, 1000),
                locked: false,
                lockBooth: function() {
                    API.moderateLockWaitList(!acidicBot.roomUtilities.booth.locked);
                    acidicBot.roomUtilities.booth.locked = false;
                    if (acidicBot.settings.lockGuard) {
                        acidicBot.roomUtilities.booth.lockTimer = setTimeout(function() {
                            API.moderateLockWaitList(acidicBot.roomUtilities.booth.locked);
                        }, acidicBot.settings.maximumLocktime * 60 * 1000);
                    }
                },
                unlockBooth: function() {
                    API.moderateLockWaitList(acidicBot.roomUtilities.booth.locked);
                    clearTimeout(acidicBot.roomUtilities.booth.lockTimer);
                }
            },
            afkCheck: function() {
                if (!acidicBot.status || !acidicBot.settings.afkRemoval) return void(0);
                var rank = acidicBot.roomUtilities.rankToNumber(acidicBot.settings.afkRankCheck);
                var djlist = API.getWaitList();
                var lastPos = Math.min(djlist.length, acidicBot.settings.afkpositionCheck);
                if (lastPos - 1 > djlist.length) return void(0);
                for (var i = 0; i < lastPos; i++) {
                    if (typeof djlist[i] !== 'undefined') {
                        var id = djlist[i].id;
                        var user = acidicBot.userUtilities.lookupUser(id);
                        if (typeof user !== 'boolean') {
                            var plugUser = acidicBot.userUtilities.getUser(user);
                            if (rank !== null && acidicBot.userUtilities.getPermission(plugUser) <= rank) {
                                var name = plugUser.username;
                                var lastActive = acidicBot.userUtilities.getLastActivity(user);
                                var inactivity = Date.now() - lastActive;
                                var time = acidicBot.roomUtilities.msToStr(inactivity);
                                var warncount = user.afkWarningCount;
                                if (inactivity > acidicBot.settings.maximumAfk * 60 * 1000) {
                                    if (warncount === 0) {
                                        API.sendChat(subChat(acidicBot.chat.warning1, {
                                            name: name,
                                            time: time
                                        }));
                                        user.afkWarningCount = 3;
                                        user.afkCountdown = setTimeout(function(userToChange) {
                                            userToChange.afkWarningCount = 1;
                                        }, 90 * 1000, user);
                                    } else if (warncount === 1) {
                                        API.sendChat(subChat(acidicBot.chat.warning2, {
                                            name: name
                                        }));
                                        user.afkWarningCount = 3;
                                        user.afkCountdown = setTimeout(function(userToChange) {
                                            userToChange.afkWarningCount = 2;
                                        }, 30 * 1000, user);
                                    } else if (warncount === 2) {
                                        var pos = API.getWaitListPosition(id);
                                        if (pos !== -1) {
                                            pos++;
                                            acidicBot.room.afkList.push([id, Date.now(), pos]);
                                            user.lastDC = {

                                                time: null,
                                                position: null,
                                                songCount: 0
                                            };
                                            API.moderateRemoveDJ(id);
                                            API.sendChat(subChat(acidicBot.chat.afkremove, {
                                                name: name,
                                                time: time,
                                                position: pos,
                                                maximumafk: acidicBot.settings.maximumAfk
                                            }));
                                        }
                                        user.afkWarningCount = 0;
                                    }
                                }
                            }
                        }
                    }
                }
            },
            changeDJCycle: function() {
                var toggle = $(".cycle-toggle");
                if (toggle.hasClass("disabled")) {
                    toggle.click();
                    if (acidicBot.settings.cycleGuard) {
                        acidicBot.room.cycleTimer = setTimeout(function() {
                            if (toggle.hasClass("enabled")) toggle.click();
                        }, acidicBot.settings.cycleMaxTime * 60 * 1000);
                    }
                } else {
                    toggle.click();
                    clearTimeout(acidicBot.room.cycleTimer);
                }
            },
            intervalMessage: function() {
                var interval;
                if (acidicBot.settings.motdEnabled) interval = acidicBot.settings.motdInterval;
                else interval = acidicBot.settings.messageInterval;
                if ((acidicBot.room.roomstats.songCount % interval) === 0 && acidicBot.status) {
                    var msg;
                    if (acidicBot.settings.motdEnabled) {
                        msg = acidicBot.settings.motd;
                    } else {
                        if (acidicBot.settings.intervalMessages.length === 0) return void(0);
                        var messageNumber = acidicBot.room.roomstats.songCount % acidicBot.settings.intervalMessages.length;
                        msg = acidicBot.settings.intervalMessages[messageNumber];
                    }
                    API.sendChat('/me ' + msg);
                }
            },
            updateBlacklists: function() {
                for (var bl in acidicBot.settings.blacklists) {
                    acidicBot.room.blacklists[bl] = [];
                    if (typeof acidicBot.settings.blacklists[bl] === 'function') {
                        acidicBot.room.blacklists[bl] = acidicBot.settings.blacklists();
                    } else if (typeof acidicBot.settings.blacklists[bl] === 'string') {
                        if (acidicBot.settings.blacklists[bl] === '') {
                            continue;
                        }
                        try {
                            (function(l) {
                                $.get(acidicBot.settings.blacklists[l], function(data) {
                                    if (typeof data === 'string') {
                                        data = JSON.parse(data);
                                    }
                                    var list = [];
                                    for (var prop in data) {
                                        if (typeof data[prop].mid !== 'undefined') {
                                            list.push(data[prop].mid);
                                        }
                                    }
                                    acidicBot.room.blacklists[l] = list;
                                })
                            })(bl);
                        } catch (e) {
                            API.chatLog('Error setting' + bl + 'blacklist.');
                            console.log('Error setting' + bl + 'blacklist.');
                            console.log(e);
                        }
                    }
                }
            },
            logNewBlacklistedSongs: function() {
                if (typeof console.table !== 'undefined') {
                    console.table(acidicBot.room.newBlacklisted);
                } else {
                    console.log(acidicBot.room.newBlacklisted);
                }
            },
            exportNewBlacklistedSongs: function() {
                var list = {};
                for (var i = 0; i < acidicBot.room.newBlacklisted.length; i++) {
                    var track = acidicBot.room.newBlacklisted[i];
                    list[track.list] = [];
                    list[track.list].push({
                        title: track.title,
                        author: track.author,
                        mid: track.mid
                    });
                }
                return list;
            }
        },
        eventChat: function(chat) {
            chat.message = linkFixer(chat.message);
            chat.message = decodeEntities(chat.message);
            chat.message = chat.message.trim();
            for (var i = 0; i < acidicBot.room.users.length; i++) {
                if (acidicBot.room.users[i].id === chat.uid) {
                    acidicBot.userUtilities.setLastActivity(acidicBot.room.users[i]);
                    if (acidicBot.room.users[i].username !== chat.un) {
                        acidicBot.room.users[i].username = chat.un;
                    }
                }
            }
            if (acidicBot.chatUtilities.chatFilter(chat)) return void(0);
            if (!acidicBot.chatUtilities.commandCheck(chat))
                acidicBot.chatUtilities.action(chat);
        },
        eventUserjoin: function(user) {
            var known = false;
            var index = null;
            for (var i = 0; i < acidicBot.room.users.length; i++) {
                if (acidicBot.room.users[i].id === user.id) {
                    known = true;
                    index = i;
                }
            }
            var greet = true;
            var welcomeback = null;
            if (known) {
                acidicBot.room.users[index].inRoom = true;
                var u = acidicBot.userUtilities.lookupUser(user.id);
                var jt = u.jointime;
                var t = Date.now() - jt;
                if (t < 10 * 1000) greet = false;
                else welcomeback = true;
            } else {
                acidicBot.room.users.push(new acidicBot.User(user.id, user.username));
                welcomeback = false;
            }
            for (var j = 0; j < acidicBot.room.users.length; j++) {
                if (acidicBot.userUtilities.getUser(acidicBot.room.users[j]).id === user.id) {
                    acidicBot.userUtilities.setLastActivity(acidicBot.room.users[j]);
                    acidicBot.room.users[j].jointime = Date.now();
                }

            }
            if (acidicBot.settings.welcome && greet) {
                welcomeback ?
                    setTimeout(function(user) {
                        API.sendChat(subChat(acidicBot.chat.welcomeback, {
                            name: user.username
                        }));
                    }, 1 * 1000, user) :
                    setTimeout(function(user) {
                        API.sendChat(subChat(acidicBot.chat.welcome, {
                            name: user.username
                        }));
                    }, 1 * 1000, user);
            }
        },
        eventUserleave: function(user) {
            var previousDJ = API.getHistory()[1].user.id;
            var lastDJ = API.getHistory()[0].user.id;
            for (var i = 0; i < acidicBot.room.users.length; i++) {
                if (acidicBot.room.users[i].id === user.id) {
                    acidicBot.userUtilities.updateDC(acidicBot.room.users[i]);
                    acidicBot.room.users[i].inRoom = false;
                    if (lastDJ == user.id || previousDJ == user.id) {
                        var user = acidicBot.userUtilities.lookupUser(acidicBot.room.users[i].id);
                        acidicBot.userUtilities.updatePosition(user, 0);
                        user.lastDC.time = null;
                        user.lastDC.position = user.lastKnownPosition;
                    }
                }
            }
        },
        eventVoteupdate: function(obj) {
            for (var i = 0; i < acidicBot.room.users.length; i++) {
                if (acidicBot.room.users[i].id === obj.user.id) {
                    if (obj.vote === 1) {
                        acidicBot.room.users[i].votes.woot++;
                    } else {
                        acidicBot.room.users[i].votes.meh++;
                    }
                }
            }

            var mehs = API.getScore().negative;
            var woots = API.getScore().positive;
            var dj = API.getDJ();

            if (acidicBot.settings.voteSkip) {
                if ((mehs - woots) >= (acidicBot.settings.voteSkipLimit)) {
                    API.sendChat(subChat(acidicBot.chat.voteskipexceededlimit, {
                        name: dj.username,
                        limit: acidicBot.settings.voteSkipLimit
                    }));
                    API.moderateForceSkip();
                }
            }

        },
        eventCurateupdate: function(obj) {
            for (var i = 0; i < acidicBot.room.users.length; i++) {
                if (acidicBot.room.users[i].id === obj.user.id) {
                    acidicBot.room.users[i].votes.curate++;
                }
            }
        },
        eventDjadvance: function(obj) {
            $("#woot").click();

            var user = acidicBot.userUtilities.lookupUser(obj.dj.id)
            for (var i = 0; i < acidicBot.room.users.length; i++) {
                if (acidicBot.room.users[i].id === user.id) {
                    acidicBot.room.users[i].lastDC = {
                        time: null,
                        position: null,
                        songCount: 0
                    };
                }
            }

            var lastplay = obj.lastPlay;
            if (typeof lastplay === 'undefined') return;
            if (acidicBot.settings.songstats) {
                if (typeof acidicBot.chat.songstatistics === "undefined") {
                    API.sendChat("/me " + lastplay.media.author + " - " + lastplay.media.title + ": " + lastplay.score.positive + "W/" + lastplay.score.grabs + "G/" + lastplay.score.negative + "M.")
                } else {
                    API.sendChat(subChat(acidicBot.chat.songstatistics, {
                        artist: lastplay.media.author,
                        title: lastplay.media.title,
                        woots: lastplay.score.positive,
                        grabs: lastplay.score.grabs,
                        mehs: lastplay.score.negative
                    }))
                }
            }
            acidicBot.room.roomstats.totalWoots += lastplay.score.positive;
            acidicBot.room.roomstats.totalMehs += lastplay.score.negative;
            acidicBot.room.roomstats.totalCurates += lastplay.score.grabs;
            acidicBot.room.roomstats.songCount++;
            acidicBot.roomUtilities.intervalMessage();
            acidicBot.room.currentDJID = obj.dj.id;

            var mid = obj.media.format + ':' + obj.media.cid;
            for (var bl in acidicBot.room.blacklists) {
                if (acidicBot.settings.blacklistEnabled) {
                    if (acidicBot.room.blacklists[bl].indexOf(mid) > -1) {
                        API.sendChat(subChat(acidicBot.chat.isblacklisted, {
                            blacklist: bl
                        }));
                        return API.moderateForceSkip();
                    }
                }
            }
            var newMedia = obj.media;
            if (acidicBot.settings.timeGuard && newMedia.duration > acidicBot.settings.maximumSongLength * 60 && !acidicBot.room.roomevent) {
                var name = obj.dj.username;
                API.sendChat(subChat(acidicBot.chat.timelimit, {
                    name: name,
                    maxlength: acidicBot.settings.maximumSongLength
                }));
                return API.moderateForceSkip();
            }
            clearTimeout(historySkip);
            if (acidicBot.settings.historySkip) {
                var alreadyPlayed = false;
                var apihistory = API.getHistory();
                var name = obj.dj.username;
                var historySkip = setTimeout(function() {
                    for (var i = 0; i < apihistory.length; i++) {
                        if (apihistory[i].media.cid === obj.media.cid) {
                            acidicBot.room.historyList[i].push(+new Date());
                            alreadyPlayed = true;
                            API.sendChat(subChat(acidicBot.chat.songknown, {
                                name: name
                            }));
                            return API.moderateForceSkip();
                        }
                    }
                    if (!alreadyPlayed) {
                        acidicBot.room.historyList.push([obj.media.cid, +new Date()]);
                    }
                }, 2000);
            }
            if (user.ownSong) {
                API.sendChat(subChat(acidicBot.chat.permissionownsong, {
                    name: user.username
                }));
                user.ownSong = false;
            }
            clearTimeout(acidicBot.room.autoskipTimer);
            if (acidicBot.room.autoskip) {
                var remaining = obj.media.duration * 1000;
                acidicBot.room.autoskipTimer = setTimeout(function() {
                    console.log("Skipping track.");
                    API.moderateForceSkip();
                }, remaining + 3000);
            }
            storeToStorage();
            sendToSocket();

        },
        eventWaitlistupdate: function(users) {
            if (users.length < 50) {
                if (acidicBot.room.queue.id.length > 0 && acidicBot.room.queueable) {
                    acidicBot.room.queueable = false;
                    setTimeout(function() {
                        acidicBot.room.queueable = true;
                    }, 500);
                    acidicBot.room.queueing++;
                    var id, pos;
                    setTimeout(
                        function() {
                            id = acidicBot.room.queue.id.splice(0, 1)[0];
                            pos = acidicBot.room.queue.position.splice(0, 1)[0];
                            API.moderateAddDJ(id, pos);
                            setTimeout(
                                function(id, pos) {
                                    API.moderateMoveDJ(id, pos);
                                    acidicBot.room.queueing--;
                                    if (acidicBot.room.queue.id.length === 0) setTimeout(function() {
                                        acidicBot.roomUtilities.booth.unlockBooth();
                                    }, 1000);
                                }, 1000, id, pos);
                        }, 1000 + acidicBot.room.queueing * 2500);
                }
            }
            for (var i = 0; i < users.length; i++) {
                var user = acidicBot.userUtilities.lookupUser(users[i].id);
                acidicBot.userUtilities.updatePosition(user, API.getWaitListPosition(users[i].id) + 1);
            }
        },
        chatcleaner: function(chat) {
            if (!acidicBot.settings.filterChat) return false;
            if (acidicBot.userUtilities.getPermission(chat.uid) > 1) return false;
            var msg = chat.message;
            var containsLetters = false;
            for (var i = 0; i < msg.length; i++) {
                ch = msg.charAt(i);
                if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9') || ch === ':' || ch === '^') containsLetters = true;
            }
            if (msg === '') {
                return true;
            }
            if (!containsLetters && (msg.length === 1 || msg.length > 3)) return true;
            msg = msg.replace(/[ ,;.:\/=~+%^*\-\\"'&@#]/g, '');
            var capitals = 0;
            var ch;
            for (var i = 0; i < msg.length; i++) {
                ch = msg.charAt(i);
                if (ch >= 'A' && ch <= 'Z') capitals++;
            }
            if (capitals >= 40) {
                API.sendChat(subChat(acidicBot.chat.caps, {
                    name: chat.un
                }));
                return true;
            }
            msg = msg.toLowerCase();
            if (msg === 'skip') {
                API.sendChat(subChat(acidicBot.chat.askskip, {
                    name: chat.un
                }));
                return true;
            }
            for (var j = 0; j < acidicBot.chatUtilities.spam.length; j++) {
                if (msg === acidicBot.chatUtilities.spam[j]) {
                    API.sendChat(subChat(acidicBot.chat.spam, {
                        name: chat.un
                    }));
                    return true;
                }
            }
            return false;
        },
        chatUtilities: {
            chatFilter: function(chat) {
                var msg = chat.message;
                var perm = acidicBot.userUtilities.getPermission(chat.uid);
                var user = acidicBot.userUtilities.lookupUser(chat.uid);
                var isMuted = false;
                for (var i = 0; i < acidicBot.room.mutedUsers.length; i++) {
                    if (acidicBot.room.mutedUsers[i] === chat.uid) isMuted = true;
                }
                if (isMuted) {
                    API.moderateDeleteChat(chat.cid);
                    return true;
                }
                if (acidicBot.settings.lockdownEnabled) {
                    if (perm === 0) {
                        API.moderateDeleteChat(chat.cid);
                        return true;
                    }
                }
                if (acidicBot.chatcleaner(chat)) {
                    API.moderateDeleteChat(chat.cid);
                    return true;
                }
                if (acidicBot.settings.cmdDeletion && msg.startsWith(acidicBot.settings.commandLiteral)) {
                    API.moderateDeleteChat(chat.cid);
                }
                if (msg.indexOf('http://adf.ly/') > -1) {
                    API.moderateDeleteChat(chat.cid);
                    API.sendChat(subChat(acidicBot.chat.adfly, {
                        name: chat.un
                    }));
                    return true;
                }
                if (msg.indexOf('autojoin was not enabled') > 0 || msg.indexOf('AFK message was not enabled') > 0 || msg.indexOf('!afkdisable') > 0 || msg.indexOf('!joindisable') > 0 || msg.indexOf('autojoin disabled') > 0 || msg.indexOf('AFK message disabled') > 0) {
                    API.moderateDeleteChat(chat.cid);
                    return true;
                }

                var rlJoinChat = acidicBot.chat.roulettejoin;
                var rlLeaveChat = acidicBot.chat.rouletteleave;

                var joinedroulette = rlJoinChat.split('%%NAME%%');
                if (joinedroulette[1].length > joinedroulette[0].length) joinedroulette = joinedroulette[1];
                else joinedroulette = joinedroulette[0];

                var leftroulette = rlLeaveChat.split('%%NAME%%');
                if (leftroulette[1].length > leftroulette[0].length) leftroulette = leftroulette[1];
                else leftroulette = leftroulette[0];

                if ((msg.indexOf(joinedroulette) > -1 || msg.indexOf(leftroulette) > -1) && chat.uid === acidicBot.loggedInID) {
                    setTimeout(function(id) {
                        API.moderateDeleteChat(id);
                    }, 5 * 1000, chat.cid);
                    return true;
                }
                return false;
            },
            commandCheck: function(chat) {
                var cmd;
                if (chat.message.charAt(0) === acidicBot.settings.commandLiteral) {
                    var space = chat.message.indexOf(' ');
                    if (space === -1) {
                        cmd = chat.message;
                    } else cmd = chat.message.substring(0, space);
                } else return false;
                var userPerm = acidicBot.userUtilities.getPermission(chat.uid);
                if (chat.message !== acidicBot.settings.commandLiteral + 'join' && chat.message !== acidicBot.settings.commandLiteral + "leave") {
                    if (userPerm === 0 && !acidicBot.room.usercommand) return void(0);
                    if (!acidicBot.room.allcommand) return void(0);
                }
                if (chat.message === acidicBot.settings.commandLiteral + 'eta' && acidicBot.settings.etaRestriction) {
                    if (userPerm < 2) {
                        var u = acidicBot.userUtilities.lookupUser(chat.uid);
                        if (u.lastEta !== null && (Date.now() - u.lastEta) < 1 * 60 * 60 * 1000) {
                            API.moderateDeleteChat(chat.cid);
                            return void(0);
                        } else u.lastEta = Date.now();
                    }
                }
                var executed = false;

                for (var comm in acidicBot.commands) {
                    var cmdCall = acidicBot.commands[comm].command;
                    if (!Array.isArray(cmdCall)) {
                        cmdCall = [cmdCall]
                    }
                    for (var i = 0; i < cmdCall.length; i++) {
                        if (acidicBot.settings.commandLiteral + cmdCall[i] === cmd) {
                            acidicBot.commands[comm].functionality(chat, acidicBot.settings.commandLiteral + cmdCall[i]);
                            executed = true;
                            break;
                        }
                    }
                }

                if (executed && userPerm === 0) {
                    acidicBot.room.usercommand = false;
                    setTimeout(function() {
                        acidicBot.room.usercommand = true;
                    }, acidicBot.settings.commandCooldown * 1000);
                }
                if (executed) {

                    acidicBot.room.allcommand = true;
                }
                return executed;
            },
            action: function(chat) {
                var user = acidicBot.userUtilities.lookupUser(chat.uid);
                if (chat.type === 'message') {
                    for (var j = 0; j < acidicBot.room.users.length; j++) {
                        if (acidicBot.userUtilities.getUser(acidicBot.room.users[j]).id === chat.uid) {
                            acidicBot.userUtilities.setLastActivity(acidicBot.room.users[j]);
                        }

                    }
                }
                acidicBot.room.roomstats.chatmessages++;
            },
            spam: [
                'hueh', 'hu3', 'brbr', 'heu', 'brbr', 'kkkk', 'spoder', 'mafia', 'zuera', 'zueira',
                'zueria', 'aehoo', 'aheu', 'alguem', 'algum', 'brazil', 'zoeira', 'fuckadmins', 'affff', 'vaisefoder', 'huenaarea',
                'hitler', 'ashua', 'ahsu', 'ashau', 'lulz', 'huehue', 'hue', 'huehuehue', 'merda', 'pqp', 'puta', 'mulher', 'pula', 'retarda', 'caralho', 'filha', 'ppk',
                'gringo', 'fuder', 'foder', 'hua', 'ahue', 'modafuka', 'modafoka', 'mudafuka', 'mudafoka', 'ooooooooooooooo', 'foda'
            ],
            curses: [
                'nigger', 'faggot', 'nigga', 'niqqa', 'motherfucker', 'modafocka'
            ]
        },
        connectAPI: function() {
            this.proxy = {
                eventChat: $.proxy(this.eventChat, this),
                eventUserskip: $.proxy(this.eventUserskip, this),
                eventUserjoin: $.proxy(this.eventUserjoin, this),
                eventUserleave: $.proxy(this.eventUserleave, this),
                eventVoteupdate: $.proxy(this.eventVoteupdate, this),
                eventCurateupdate: $.proxy(this.eventCurateupdate, this),
                eventRoomscoreupdate: $.proxy(this.eventRoomscoreupdate, this),
                eventDjadvance: $.proxy(this.eventDjadvance, this),
                eventWaitlistupdate: $.proxy(this.eventWaitlistupdate, this),
                eventVoteskip: $.proxy(this.eventVoteskip, this),
                eventModskip: $.proxy(this.eventModskip, this),
                eventChatcommand: $.proxy(this.eventChatcommand, this),
                eventHistoryupdate: $.proxy(this.eventHistoryupdate, this),

            };
            API.on(API.CHAT, this.proxy.eventChat);
            API.on(API.USER_SKIP, this.proxy.eventUserskip);
            API.on(API.USER_JOIN, this.proxy.eventUserjoin);
            API.on(API.USER_LEAVE, this.proxy.eventUserleave);
            API.on(API.VOTE_UPDATE, this.proxy.eventVoteupdate);
            API.on(API.GRAB_UPDATE, this.proxy.eventCurateupdate);
            API.on(API.ROOM_SCORE_UPDATE, this.proxy.eventRoomscoreupdate);
            API.on(API.ADVANCE, this.proxy.eventDjadvance);
            API.on(API.WAIT_LIST_UPDATE, this.proxy.eventWaitlistupdate);
            API.on(API.MOD_SKIP, this.proxy.eventModskip);
            API.on(API.CHAT_COMMAND, this.proxy.eventChatcommand);
            API.on(API.HISTORY_UPDATE, this.proxy.eventHistoryupdate);
        },
        disconnectAPI: function() {
            API.off(API.CHAT, this.proxy.eventChat);
            API.off(API.USER_SKIP, this.proxy.eventUserskip);
            API.off(API.USER_JOIN, this.proxy.eventUserjoin);
            API.off(API.USER_LEAVE, this.proxy.eventUserleave);
            API.off(API.VOTE_UPDATE, this.proxy.eventVoteupdate);
            API.off(API.CURATE_UPDATE, this.proxy.eventCurateupdate);
            API.off(API.ROOM_SCORE_UPDATE, this.proxy.eventRoomscoreupdate);
            API.off(API.ADVANCE, this.proxy.eventDjadvance);
            API.off(API.WAIT_LIST_UPDATE, this.proxy.eventWaitlistupdate);
            API.off(API.MOD_SKIP, this.proxy.eventModskip);
            API.off(API.CHAT_COMMAND, this.proxy.eventChatcommand);
            API.off(API.HISTORY_UPDATE, this.proxy.eventHistoryupdate);
        },
        startup: function() {
            Function.prototype.toString = function() {
                return 'Function.'
            };
            var u = API.getUser();
            if (acidicBot.userUtilities.getPermission(u) < 2) return API.chatLog(acidicBot.chat.greyuser);
            if (acidicBot.userUtilities.getPermission(u) === 2) API.chatLog(acidicBot.chat.bouncer);
            acidicBot.connectAPI();
            API.moderateDeleteChat = function(cid) {
                $.ajax({
                    url: "https://plug.dj/_/chat/" + cid,
                    type: "DELETE"
                })
            };

            var roomURL = window.location.pathname;
            var Check;

            var detect = function() {
                if (roomURL != window.location.pathname) {
                    clearInterval(Check)
                    console.log("Killing bot after room change.");
                    storeToStorage();
                    acidicBot.disconnectAPI();
                    setTimeout(function() {
                        kill();
                    }, 1000);
                }
            };

            Check = setInterval(function() {
                detect()
            }, 100);

            retrieveSettings();
            retrieveFromStorage();
            window.bot = acidicBot;
            acidicBot.roomUtilities.updateBlacklists();
            setInterval(acidicBot.roomUtilities.updateBlacklists, 60 * 60 * 1000);
            acidicBot.getNewBlacklistedSongs = acidicBot.roomUtilities.exportNewBlacklistedSongs;
            acidicBot.logNewBlacklistedSongs = acidicBot.roomUtilities.logNewBlacklistedSongs;
            if (acidicBot.room.roomstats.launchTime === null) {
                acidicBot.room.roomstats.launchTime = Date.now();
            }

            for (var j = 0; j < acidicBot.room.users.length; j++) {
                acidicBot.room.users[j].inRoom = false;
            }
            var userlist = API.getUsers();
            for (var i = 0; i < userlist.length; i++) {
                var known = false;
                var ind = null;
                for (var j = 0; j < acidicBot.room.users.length; j++) {
                    if (acidicBot.room.users[j].id === userlist[i].id) {
                        known = true;
                        ind = j;
                    }
                }
                if (known) {
                    acidicBot.room.users[ind].inRoom = true;
                } else {
                    acidicBot.room.users.push(new acidicBot.User(userlist[i].id, userlist[i].username));
                    ind = acidicBot.room.users.length - 1;
                }
                var wlIndex = API.getWaitListPosition(acidicBot.room.users[ind].id) + 1;
                acidicBot.userUtilities.updatePosition(acidicBot.room.users[ind], wlIndex);
            }
            acidicBot.room.afkInterval = setInterval(function() {
                acidicBot.roomUtilities.afkCheck()
            }, 10 * 1000);
            acidicBot.room.autodisableInterval = setInterval(function() {
                acidicBot.room.autodisableFunc();
            }, 60 * 60 * 1000);
            acidicBot.loggedInID = API.getUser().id;
            acidicBot.status = true;
            API.sendChat('/cap ' + acidicBot.settings.startupCap);
            API.setVolume(acidicBot.settings.startupVolume);
            $("#woot").click();
            if (acidicBot.settings.startupEmoji) {
                var emojibuttonoff = $(".icon-emoji-off");
                if (emojibuttonoff.length > 0) {
                    emojibuttonoff[0].click();
                }
                API.chatLog(':smile: Emojis enabled.');
            } else {
                var emojibuttonon = $(".icon-emoji-on");
                if (emojibuttonon.length > 0) {
                    emojibuttonon[0].click();
                }
                API.chatLog('Emojis disabled.');
            }
            API.chatLog('Avatars capped at ' + acidicBot.settings.startupCap);
            API.chatLog('Volume set to ' + acidicBot.settings.startupVolume);
            socket();
            loadChat(API.sendChat(subChat(acidicBot.chat.online, {
                botname: acidicBot.settings.botName,
                version: acidicBot.version
            })));
        },
        commands: {
            executable: function(minRank, chat) {
                var id = chat.uid;
                var perm = acidicBot.userUtilities.getPermission(id);
                var minPerm;
                switch (minRank) {
                    case 'admin':
                        minPerm = 10;
                        break;
                    case 'ambassador':
                        minPerm = 7;
                        break;
                    case 'host':
                        minPerm = 5;
                        break;
                    case 'cohost':
                        minPerm = 4;
                        break;
                    case 'manager':
                        minPerm = 3;
                        break;
                    case 'mod':
                        if (acidicBot.settings.bouncerPlus) {
                            minPerm = 2;
                        } else {
                            minPerm = 3;
                        }
                        break;
                    case 'bouncer':
                        minPerm = 2;
                        break;
                    case 'residentdj':
                        minPerm = 1;
                        break;
                    case 'user':
                        minPerm = 0;
                        break;
                    default:
                        API.chatLog('error assigning minimum permission');
                }
                return perm >= minPerm;

            },

            activeCommand: {
                command: 'active',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        var now = Date.now();
                        var chatters = 0;
                        var time;
                        if (msg.length === cmd.length) time = 60;
                        else {
                            time = msg.substring(cmd.length + 1);
                            if (isNaN(time)) return API.sendChat(subChat(acidicBot.chat.invalidtime, {
                                name: chat.un
                            }));
                        }
                        for (var i = 0; i < acidicBot.room.users.length; i++) {
                            userTime = acidicBot.userUtilities.getLastActivity(acidicBot.room.users[i]);
                            if ((now - userTime) <= (time * 60 * 1000)) {
                                chatters++;
                            }
                        }
                        API.sendChat(subChat(acidicBot.chat.activeusersintime, {
                            name: chat.un,
                            amount: chatters,
                            time: time
                        }));
                    }
                }
            },

            addCommand: {
                command: 'add',
                rank: 'mod',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(acidicBot.chat.nouserspecified, {
                            name: chat.un
                        }));
                        var name = msg.substr(cmd.length + 2);
                        var user = acidicBot.userUtilities.lookupUserName(name);
                        if (msg.length > cmd.length + 2) {
                            if (typeof user !== 'undefined') {
                                if (acidicBot.room.roomevent) {
                                    acidicBot.room.eventArtists.push(user.id);
                                }
                                API.moderateAddDJ(user.id);
                            } else API.sendChat(subChat(acidicBot.chat.invaliduserspecified, {
                                name: chat.un
                            }));
                        }
                    }
                }
            },

            afklimitCommand: {
                command: 'afklimit',
                rank: 'manager',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(acidicBot.chat.nolimitspecified, {
                            name: chat.un
                        }));
                        var limit = msg.substring(cmd.length + 1);
                        if (!isNaN(limit)) {
                            acidicBot.settings.maximumAfk = parseInt(limit, 10);
                            API.sendChat(subChat(acidicBot.chat.maximumafktimeset, {
                                name: chat.un,
                                time: acidicBot.settings.maximumAfk
                            }));
                        } else API.sendChat(subChat(acidicBot.chat.invalidlimitspecified, {
                            name: chat.un
                        }));
                    }
                }
            },

            afkremovalCommand: {
                command: 'afkremoval',
                rank: 'mod',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (acidicBot.settings.afkRemoval) {
                            acidicBot.settings.afkRemoval = !acidicBot.settings.afkRemoval;
                            clearInterval(acidicBot.room.afkInterval);
                            API.sendChat(subChat(acidicBot.chat.toggleoff, {
                                name: chat.un,
                                'function': acidicBot.chat.afkremoval
                            }));
                        } else {
                            acidicBot.settings.afkRemoval = !acidicBot.settings.afkRemoval;
                            acidicBot.room.afkInterval = setInterval(function() {
                                acidicBot.roomUtilities.afkCheck()
                            }, 2 * 1000);
                            API.sendChat(subChat(acidicBot.chat.toggleon, {
                                name: chat.un,
                                'function': acidicBot.chat.afkremoval
                            }));
                        }
                    }
                }
            },

            afkresetCommand: {
                command: 'afkreset',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(acidicBot.chat.nouserspecified, {
                            name: chat.un
                        }));
                        var name = msg.substring(cmd.length + 2);
                        var user = acidicBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(acidicBot.chat.invaliduserspecified, {
                            name: chat.un
                        }));
                        acidicBot.userUtilities.setLastActivity(user);
                        API.sendChat(subChat(acidicBot.chat.afkstatusreset, {
                            name: chat.un,
                            username: name
                        }));
                    }
                }
            },

            afktimeCommand: {
                command: 'afktime',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(acidicBot.chat.nouserspecified, {
                            name: chat.un
                        }));
                        var name = msg.substring(cmd.length + 2);
                        var user = acidicBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(acidicBot.chat.invaliduserspecified, {
                            name: chat.un
                        }));
                        var lastActive = acidicBot.userUtilities.getLastActivity(user);
                        var inactivity = Date.now() - lastActive;
                        var time = acidicBot.roomUtilities.msToStr(inactivity);

                        var launchT = acidicBot.room.roomstats.launchTime;
                        var durationOnline = Date.now() - launchT;

                        if (inactivity == durationOnline) {
                            API.sendChat(subChat(acidicBot.chat.inactivelonger, {
                                botname: acidicBot.settings.botName,
                                name: chat.un,
                                username: name
                            }));
                        } else {
                            API.sendChat(subChat(acidicBot.chat.inactivefor, {
                                name: chat.un,
                                username: name,
                                time: time
                            }));
                        }
                    }
                }
            },

            autodisableCommand: {
                command: 'autodisable',
                rank: 'bouncer',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (acidicBot.settings.autodisable) {
                            acidicBot.settings.autodisable = !acidicBot.settings.autodisable;
                            return API.sendChat(subChat(acidicBot.chat.toggleoff, {
                                name: chat.un,
                                'function': acidicBot.chat.autodisable
                            }));
                        } else {
                            acidicBot.settings.autodisable = !acidicBot.settings.autodisable;
                            return API.sendChat(subChat(acidicBot.chat.toggleon, {
                                name: chat.un,
                                'function': acidicBot.chat.autodisable
                            }));
                        }

                    }
                }
            },

            autoskipCommand: {
                command: 'autoskip',
                rank: 'mod',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (acidicBot.room.autoskip) {
                            acidicBot.room.autoskip = !acidicBot.room.autoskip;
                            clearTimeout(acidicBot.room.autoskipTimer);
                            return API.sendChat(subChat(acidicBot.chat.toggleoff, {
                                name: chat.un,
                                'function': acidicBot.chat.autoskip
                            }));
                        } else {
                            acidicBot.room.autoskip = !acidicBot.room.autoskip;
                            return API.sendChat(subChat(acidicBot.chat.toggleon, {
                                name: chat.un,
                                'function': acidicBot.chat.autoskip
                            }));
                        }
                    }
                }
            },

            autowootCommand: {
                command: 'autowoot',
                rank: 'user',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        API.sendChat(acidicBot.chat.autowoot);
                    }
                }
            },

            baCommand: {
                command: 'ba',
                rank: 'user',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        API.sendChat(acidicBot.chat.brandambassador);
                    }
                }
            },

            ballCommand: {
                command: ['8ball', 'ask'],
                rank: 'user',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var crowd = API.getUsers();
                        var msg = chat.message;
                        var argument = msg.substring(cmd.length + 1).replace(/@/g, '');
                        var randomUser = Math.floor(Math.random() * crowd.length);
                        var randomBall = Math.floor(Math.random() * acidicBot.chat.balls.length);
                        var randomSentence = Math.floor(Math.random() * 1);
                        API.sendChat(subChat(acidicBot.chat.ball, {
                            name: chat.un,
                            botname: acidicBot.settings.botName,
                            question: argument,
                            response: acidicBot.chat.balls[randomBall]
                        }));
                    }
                }
            },

            banCommand: {
                command: 'ban',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(acidicBot.chat.nouserspecified, {
                            name: chat.un
                        }));
                        var name = msg.substr(cmd.length + 2);
                        var user = acidicBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(acidicBot.chat.invaliduserspecified, {
                            name: chat.un
                        }));
                        API.moderateBanUser(user.id, 1, API.BAN.DAY);
                    }
                }
            },

            blacklistCommand: {
                command: ['blacklist', 'bl'],
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(acidicBot.chat.nolistspecified, {
                            name: chat.un
                        }));
                        var list = msg.substr(cmd.length + 1);
                        if (typeof acidicBot.room.blacklists[list] === 'undefined') return API.sendChat(subChat(acidicBot.chat.invalidlistspecified, {
                            name: chat.un
                        }));
                        else {
                            var media = API.getMedia();
                            var track = {
                                list: list,
                                author: media.author,
                                title: media.title,
                                mid: media.format + ':' + media.cid
                            };
                            acidicBot.room.newBlacklisted.push(track);
                            acidicBot.room.blacklists[list].push(media.format + ':' + media.cid);
                            API.sendChat(subChat(acidicBot.chat.newblacklisted, {
                                name: chat.un,
                                blacklist: list,
                                author: media.author,
                                title: media.title,
                                mid: media.format + ':' + media.cid
                            }));
                            API.moderateForceSkip();
                            if (typeof acidicBot.room.newBlacklistedSongFunction === 'function') {
                                acidicBot.room.newBlacklistedSongFunction(track);
                            }
                        }
                    }
                }
            },

            blinfoCommand: {
                command: 'blinfo',
                rank: 'bouncer',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var author = API.getMedia().author;
                        var title = API.getMedia().title;
                        var name = chat.un;
                        var format = API.getMedia().format;
                        var cid = API.getMedia().cid;
                        var songid = format + ":" + cid;

                        API.sendChat(subChat(acidicBot.chat.blinfo, {
                            name: name,
                            author: author,
                            title: title,
                            songid: songid
                        }));
                    }
                }
            },

            bouncerPlusCommand: {
                command: 'bouncer+',
                rank: 'mod',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        if (acidicBot.settings.bouncerPlus) {
                            acidicBot.settings.bouncerPlus = false;
                            return API.sendChat(subChat(acidicBot.chat.toggleoff, {
                                name: chat.un,
                                'function': 'Bouncer+'
                            }));
                        } else {
                            if (!acidicBot.settings.bouncerPlus) {
                                var id = chat.uid;
                                var perm = acidicBot.userUtilities.getPermission(id);
                                if (perm > 2) {
                                    acidicBot.settings.bouncerPlus = true;
                                    return API.sendChat(subChat(acidicBot.chat.toggleon, {
                                        name: chat.un,
                                        'function': 'Bouncer+'
                                    }));
                                }
                            } else return API.sendChat(subChat(acidicBot.chat.bouncerplusrank, {
                                name: chat.un
                            }));
                        }
                    }
                }
            },

            botnameCommand: {
                command: 'botname',
                rank: 'manager',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        if (msg.length <= cmd.length + 1) return API.sendChat(subChat(acidicBot.chat.currentbotname, {
                            botname: acidicBot.settings.botName
                        }));
                        var argument = msg.substring(cmd.length + 1);
                        if (argument) {
                            acidicBot.settings.botName = argument;
                            API.sendChat(subChat(acidicBot.chat.botnameset, {
                                botName: acidicBot.settings.botName
                            }));
                        }
                    }
                }
            },

            clearchatCommand: {
                command: 'clearchat',
                rank: 'manager',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var currentchat = $('#chat-messages').children();
                        for (var i = 0; i < currentchat.length; i++) {
                            API.moderateDeleteChat(currentchat[i].getAttribute("data-cid"));
                        }
                        return API.sendChat(subChat(acidicBot.chat.chatcleared, {
                            name: chat.un
                        }));
                    }
                }
            },

            commandsCommand: {
                command: 'commands',
                rank: 'user',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        API.sendChat(subChat(acidicBot.chat.commandslink, {
                            botname: acidicBot.settings.botName,
                            link: acidicBot.cmdLink
                        }));
                    }
                }
            },

            cmddeletionCommand: {
                command: ['commanddeletion', 'cmddeletion', 'cmddel'],
                rank: 'mod',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (acidicBot.settings.cmdDeletion) {
                            acidicBot.settings.cmdDeletion = !acidicBot.settings.cmdDeletion;
                            API.sendChat(subChat(acidicBot.chat.toggleoff, {
                                name: chat.un,
                                'function': acidicBot.chat.cmddeletion
                            }));
                        } else {
                            acidicBot.settings.cmdDeletion = !acidicBot.settings.cmdDeletion;
                            API.sendChat(subChat(acidicBot.chat.toggleon, {
                                name: chat.un,
                                'function': acidicBot.chat.cmddeletion
                            }));
                        }
                    }
                }
            },

            cookieCommand: {
                command: 'cookie',
                rank: 'user',
                type: 'startsWith',
                getCookie: function(chat) {
                    var c = Math.floor(Math.random() * acidicBot.chat.cookies.length);
                    return acidicBot.chat.cookies[c];
                },
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;

                        var space = msg.indexOf(' ');
                        if (space === -1) {
                            API.sendChat(acidicBot.chat.eatcookie);
                            return false;
                        } else {
                            var name = msg.substring(space + 2);
                            var user = acidicBot.userUtilities.lookupUserName(name);
                            if (user === false || !user.inRoom) {
                                return API.sendChat(subChat(acidicBot.chat.nousercookie, {
                                    name: name
                                }));
                            } else if (user.username === chat.un) {
                                return API.sendChat(subChat(acidicBot.chat.selfcookie, {
                                    name: name
                                }));
                            } else {
                                return API.sendChat(subChat(acidicBot.chat.cookie, {
                                    nameto: user.username,
                                    namefrom: chat.un,
                                    cookie: this.getCookie()
                                }));
                            }
                        }
                    }
                }
            },

            cycleCommand: {
                command: 'cycle',
                rank: 'manager',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        acidicBot.roomUtilities.changeDJCycle();
                    }
                }
            },

            cycleguardCommand: {
                command: 'cycleguard',
                rank: 'bouncer',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (acidicBot.settings.cycleGuard) {
                            acidicBot.settings.cycleGuard = !acidicBot.settings.cycleGuard;
                            return API.sendChat(subChat(acidicBot.chat.toggleoff, {
                                name: chat.un,
                                'function': acidicBot.chat.cycleguard
                            }));
                        } else {
                            acidicBot.settings.cycleGuard = !acidicBot.settings.cycleGuard;
                            return API.sendChat(subChat(acidicBot.chat.toggleon, {
                                name: chat.un,
                                'function': acidicBot.chat.cycleguard
                            }));
                        }

                    }
                }
            },

            cycletimerCommand: {
                command: 'cycletimer',
                rank: 'manager',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        var cycleTime = msg.substring(cmd.length + 1);
                        if (!isNaN(cycleTime) && cycleTime !== "") {
                            acidicBot.settings.maximumCycletime = cycleTime;
                            return API.sendChat(subChat(acidicBot.chat.cycleguardtime, {
                                name: chat.un,
                                time: acidicBot.settings.maximumCycletime
                            }));
                        } else return API.sendChat(subChat(acidicBot.chat.invalidtime, {
                            name: chat.un
                        }));

                    }
                }
            },

            dclookupCommand: {
                command: ['dclookup', 'dc'],
                rank: 'user',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        var name;
                        if (msg.length === cmd.length) name = chat.un;
                        else {
                            name = msg.substring(cmd.length + 2);
                            var perm = acidicBot.userUtilities.getPermission(chat.uid);
                            if (perm < 2) return API.sendChat(subChat(acidicBot.chat.dclookuprank, {
                                name: chat.un
                            }));
                        }
                        var user = acidicBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(acidicBot.chat.invaliduserspecified, {
                            name: chat.un
                        }));
                        var toChat = acidicBot.userUtilities.dclookup(user.id);
                        API.sendChat(toChat);
                    }
                }
            },

            emojiCommand: {
                command: 'emoji',
                rank: 'user',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var link = 'http://www.emoji-cheat-sheet.com/';
                        API.sendChat(subChat(acidicBot.chat.emojilist, {
                            link: link
                        }));
                    }
                }
            },

            englishCommand: {
                command: 'english',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (chat.message.length === cmd.length) return API.sendChat('/me No user specified.');
                        var name = chat.message.substring(cmd.length + 2);
                        var user = acidicBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat('/me Invalid user specified.');
                        var lang = acidicBot.userUtilities.getUser(user).language;
                        var ch = '/me @' + name + ' ';
                        switch (lang) {
                            case 'en':
                                break;
                            case 'da':
                                ch += 'Vær venlig at tale engelsk.';
                                break;
                            case 'de':
                                ch += 'Bitte sprechen Sie Englisch.';
                                break;
                            case 'es':
                                ch += 'Por favor, hable Inglés.';
                                break;
                            case 'fr':
                                ch += 'Parlez anglais, s\'il vous plaît.';
                                break;
                            case 'nl':
                                ch += 'Spreek Engels, alstublieft.';
                                break;
                            case 'pl':
                                ch += 'Proszę mówić po angielsku.';
                                break;
                            case 'pt':
                                ch += 'Por favor, fale Inglês.';
                                break;
                            case 'sk':
                                ch += 'Hovorte po anglicky, prosím.';
                                break;
                            case 'cs':
                                ch += 'Mluvte prosím anglicky.';
                                break;
                            case 'sr':
                                ch += 'Молим Вас, говорите енглески.';
                                break;
                        }
                        ch += ' English please.';
                        API.sendChat(ch);
                    }
                }
            },

            etaCommand: {
                command: 'eta',
                rank: 'user',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var perm = acidicBot.userUtilities.getPermission(chat.uid);
                        var msg = chat.message;
                        var name;
                        if (msg.length > cmd.length) {
                            if (perm < 2) return void(0);
                            name = msg.substring(cmd.length + 2);
                        } else name = chat.un;
                        var user = acidicBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(acidicBot.chat.invaliduserspecified, {
                            name: chat.un
                        }));
                        var pos = API.getWaitListPosition(user.id);
                        if (pos < 0) return API.sendChat(subChat(acidicBot.chat.notinwaitlist, {
                            name: name
                        }));
                        var timeRemaining = API.getTimeRemaining();
                        var estimateMS = ((pos + 1) * 4 * 60 + timeRemaining) * 1000;
                        var estimateString = acidicBot.roomUtilities.msToStr(estimateMS);
                        API.sendChat(subChat(acidicBot.chat.eta, {
                            name: name,
                            time: estimateString
                        }));
                    }
                }
            },

            fbCommand: {
                command: 'fb',
                rank: 'user',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (typeof acidicBot.settings.fbLink === "string")
                            API.sendChat(subChat(acidicBot.chat.facebook, {
                                link: acidicBot.settings.fbLink
                            }));
                    }
                }
            },

            filterCommand: {
                command: 'filter',
                rank: 'bouncer',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (acidicBot.settings.filterChat) {
                            acidicBot.settings.filterChat = !acidicBot.settings.filterChat;
                            return API.sendChat(subChat(acidicBot.chat.toggleoff, {
                                name: chat.un,
                                'function': acidicBot.chat.chatfilter
                            }));
                        } else {
                            acidicBot.settings.filterChat = !acidicBot.settings.filterChat;
                            return API.sendChat(subChat(acidicBot.chat.toggleon, {
                                name: chat.un,
                                'function': acidicBot.chat.chatfilter
                            }));
                        }
                    }
                }
            },

            ghostbusterCommand: {
                command: 'ghostbuster',
                rank: 'user',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        var name;
                        if (msg.length === cmd.length) name = chat.un;
                        else {
                            name = msg.substr(cmd.length + 2);
                        }
                        var user = acidicBot.userUtilities.lookupUserName(name);
                        if (user === false || !user.inRoom) {
                            return API.sendChat(subChat(acidicBot.chat.ghosting, {
                                name1: chat.un,
                                name2: name
                            }));
                        } else API.sendChat(subChat(acidicBot.chat.notghosting, {
                            name1: chat.un,
                            name2: name
                        }));
                    }
                }
            },

            gifCommand: {
                command: ['gif', 'giphy'],
                rank: 'user',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        if (msg.length !== cmd.length) {
                            function get_id(api_key, fixedtag, func) {
                                $.getJSON(
                                    "https://tv.giphy.com/v1/gifs/random?", {
                                        "format": "json",
                                        "api_key": api_key,
                                        "rating": rating,
                                        "tag": fixedtag
                                    },
                                    function(response) {
                                        func(response.data.id);
                                    }
                                )
                            }
                            var api_key = "dc6zaTOxFJmzC";
                            var rating = "pg-13";
                            var tag = msg.substr(cmd.length + 1);
                            var fixedtag = tag.replace(/ /g, "+");
                            var commatag = tag.replace(/ /g, ", ");
                            get_id(api_key, tag, function(id) {
                                if (typeof id !== 'undefined') {
                                    API.sendChat(subChat(acidicBot.chat.validgiftags, {
                                        name: chat.un,
                                        id: id,
                                        tags: commatag
                                    }));
                                } else {
                                    API.sendChat(subChat(acidicBot.chat.invalidgiftags, {
                                        name: chat.un,
                                        tags: commatag
                                    }));
                                }
                            });
                        } else {
                            function get_random_id(api_key, func) {
                                $.getJSON(
                                    "https://tv.giphy.com/v1/gifs/random?", {
                                        "format": "json",
                                        "api_key": api_key,
                                        "rating": rating
                                    },
                                    function(response) {
                                        func(response.data.id);
                                    }
                                )
                            }
                            var api_key = "dc6zaTOxFJmzC";
                            var rating = "pg-13";
                            get_random_id(api_key, function(id) {
                                if (typeof id !== 'undefined') {
                                    API.sendChat(subChat(acidicBot.chat.validgifrandom, {
                                        name: chat.un,
                                        id: id
                                    }));
                                } else {
                                    API.sendChat(subChat(acidicBot.chat.invalidgifrandom, {
                                        name: chat.un
                                    }));
                                }
                            });
                        }
                    }
                }
            },

            helpCommand: {
                command: 'help',
                rank: 'user',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var link = "(Updated link coming soon)";
                        API.sendChat(subChat(acidicBot.chat.starterhelp, {
                            link: link
                        }));
                    }
                }
            },

            historyskipCommand: {
                command: 'historyskip',
                rank: 'bouncer',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (acidicBot.settings.historySkip) {
                            acidicBot.settings.historySkip = !acidicBot.settings.historySkip;
                            API.sendChat(subChat(acidicBot.chat.toggleoff, {
                                name: chat.un,
                                'function': acidicBot.chat.historyskip
                            }));
                        } else {
                            acidicBot.settings.historySkip = !acidicBot.settings.historySkip;
                            API.sendChat(subChat(acidicBot.chat.toggleon, {
                                name: chat.un,
                                'function': acidicBot.chat.historyskip
                            }));
                        }
                    }
                }
            },

            joinCommand: {
                command: 'join',
                rank: 'user',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (acidicBot.room.roulette.rouletteStatus && acidicBot.room.roulette.participants.indexOf(chat.uid) < 0) {
                            acidicBot.room.roulette.participants.push(chat.uid);
                            API.sendChat(subChat(acidicBot.chat.roulettejoin, {
                                name: chat.un
                            }));
                        }
                    }
                }
            },

            jointimeCommand: {
                command: 'jointime',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(acidicBot.chat.nouserspecified, {
                            name: chat.un
                        }));
                        var name = msg.substring(cmd.length + 2);
                        var user = acidicBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(acidicBot.chat.invaliduserspecified, {
                            name: chat.un
                        }));
                        var join = acidicBot.userUtilities.getJointime(user);
                        var time = Date.now() - join;
                        var timeString = acidicBot.roomUtilities.msToStr(time);
                        API.sendChat(subChat(acidicBot.chat.jointime, {
                            namefrom: chat.un,
                            username: name,
                            time: timeString
                        }));
                    }
                }
            },

            kickCommand: {
                command: 'kick',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        var lastSpace = msg.lastIndexOf(' ');
                        var time;
                        var name;
                        if (lastSpace === msg.indexOf(' ')) {
                            time = 0.25;
                            name = msg.substring(cmd.length + 2);
                        } else {
                            time = msg.substring(lastSpace + 1);
                            name = msg.substring(cmd.length + 2, lastSpace);
                        }

                        var user = acidicBot.userUtilities.lookupUserName(name);
                        var from = chat.un;
                        if (typeof user === 'boolean') return API.sendChat(subChat(acidicBot.chat.nouserspecified, {
                            name: chat.un
                        }));

                        var permFrom = acidicBot.userUtilities.getPermission(chat.uid);
                        var permTokick = acidicBot.userUtilities.getPermission(user.id);

                        if (permFrom <= permTokick)
                            return API.sendChat(subChat(acidicBot.chat.kickrank, {
                                name: chat.un
                            }));

                        if (!isNaN(time)) {
                            API.sendChat(subChat(acidicBot.chat.kick, {
                                name: chat.un,
                                username: name,
                                time: time
                            }));
                            if (time > 24 * 60 * 60) API.moderateBanUser(user.id, 1, API.BAN.PERMA);
                            else API.moderateBanUser(user.id, 1, API.BAN.DAY);
                            setTimeout(function(id, name) {
                                API.moderateUnbanUser(id);
                                console.log('Unbanned @' + name + '. (' + id + ')');
                            }, time * 60 * 1000, user.id, name);
                        } else API.sendChat(subChat(acidicBot.chat.invalidtime, {
                            name: chat.un
                        }));
                    }
                }
            },

            killCommand: {
                command: 'kill',
                rank: 'bouncer',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        storeToStorage();
                        sendToSocket();
                        API.sendChat(acidicBot.chat.kill);
                        acidicBot.disconnectAPI();
                        setTimeout(function() {
                            kill();
                        }, 1000);
                    }
                }
            },

            languageCommand: {
                command: 'language',
                rank: 'manager',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        if (msg.length <= cmd.length + 1) return API.sendChat(subChat(acidicBot.chat.currentlang, {
                            language: acidicBot.settings.language
                        }));
                        var argument = msg.substring(cmd.length + 1);

                        $.get("https://rawgit.com/Yemasthui/basicBot/master/lang/langIndex.json", function(json) {
                            var langIndex = json;
                            var link = langIndex[argument.toLowerCase()];
                            if (typeof link === "undefined") {
                                API.sendChat(subChat(acidicBot.chat.langerror, {
                                    link: "http://git.io/vJ9nI"
                                }));
                            } else {
                                acidicBot.settings.language = argument;
                                loadChat();
                                API.sendChat(subChat(acidicBot.chat.langset, {
                                    language: acidicBot.settings.language
                                }));
                            }
                        });
                    }
                }
            },

            leaveCommand: {
                command: 'leave',
                rank: 'user',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var ind = acidicBot.room.roulette.participants.indexOf(chat.uid);
                        if (ind > -1) {
                            acidicBot.room.roulette.participants.splice(ind, 1);
                            API.sendChat(subChat(acidicBot.chat.rouletteleave, {
                                name: chat.un
                            }));
                        }
                    }
                }
            },

            linkCommand: {
                command: 'link',
                rank: 'user',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var media = API.getMedia();
                        var from = chat.un;
                        var user = acidicBot.userUtilities.lookupUser(chat.uid);
                        var perm = acidicBot.userUtilities.getPermission(chat.uid);
                        var dj = API.getDJ().id;
                        var isDj = false;
                        if (dj === chat.uid) isDj = true;
                        if (perm >= 1 || isDj) {
                            if (media.format === 1) {
                                var linkToSong = "http://youtu.be/" + media.cid;
                                API.sendChat(subChat(acidicBot.chat.songlink, {
                                    name: from,
                                    link: linkToSong
                                }));
                            }
                            if (media.format === 2) {
                                SC.get('/tracks/' + media.cid, function(sound) {
                                    API.sendChat(subChat(acidicBot.chat.songlink, {
                                        name: from,
                                        link: sound.permalink_url
                                    }));
                                });
                            }
                        }
                    }
                }
            },

            lockCommand: {
                command: 'lock',
                rank: 'mod',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        acidicBot.roomUtilities.booth.lockBooth();
                    }
                }
            },

            lockdownCommand: {
                command: 'lockdown',
                rank: 'mod',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var temp = acidicBot.settings.lockdownEnabled;
                        acidicBot.settings.lockdownEnabled = !temp;
                        if (acidicBot.settings.lockdownEnabled) {
                            return API.sendChat(subChat(acidicBot.chat.toggleon, {
                                name: chat.un,
                                'function': acidicBot.chat.lockdown
                            }));
                        } else return API.sendChat(subChat(acidicBot.chat.toggleoff, {
                            name: chat.un,
                            'function': acidicBot.chat.lockdown
                        }));
                    }
                }
            },

            lockguardCommand: {
                command: 'lockguard',
                rank: 'bouncer',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (acidicBot.settings.lockGuard) {
                            acidicBot.settings.lockGuard = !acidicBot.settings.lockGuard;
                            return API.sendChat(subChat(acidicBot.chat.toggleoff, {
                                name: chat.un,
                                'function': acidicBot.chat.lockguard
                            }));
                        } else {
                            acidicBot.settings.lockGuard = !acidicBot.settings.lockGuard;
                            return API.sendChat(subChat(acidicBot.chat.toggleon, {
                                name: chat.un,
                                'function': acidicBot.chat.lockguard
                            }));
                        }
                    }
                }
            },

            lockskipCommand: {
                command: 'lockskip',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (acidicBot.room.skippable) {
                            var dj = API.getDJ();
                            var id = dj.id;
                            var name = dj.username;
                            var msgSend = '@' + name + ': ';
                            acidicBot.room.queueable = false;

                            if (chat.message.length === cmd.length) {
                                API.sendChat(subChat(acidicBot.chat.usedlockskip, {
                                    name: chat.un
                                }));
                                acidicBot.roomUtilities.booth.lockBooth();
                                setTimeout(function(id) {
                                    API.moderateForceSkip();
                                    acidicBot.room.skippable = false;
                                    setTimeout(function() {
                                        acidicBot.room.skippable = true
                                    }, 5 * 1000);
                                    setTimeout(function(id) {
                                        acidicBot.userUtilities.moveUser(id, acidicBot.settings.lockskipPosition, false);
                                        acidicBot.room.queueable = true;
                                        setTimeout(function() {
                                            acidicBot.roomUtilities.booth.unlockBooth();
                                        }, 1000);
                                    }, 1500, id);
                                }, 1000, id);
                                return void(0);
                            }
                            var validReason = false;
                            var msg = chat.message;
                            var reason = msg.substring(cmd.length + 1);
                            for (var i = 0; i < acidicBot.settings.lockskipReasons.length; i++) {
                                var r = acidicBot.settings.lockskipReasons[i][0];
                                if (reason.indexOf(r) !== -1) {
                                    validReason = true;
                                    msgSend += acidicBot.settings.lockskipReasons[i][1];
                                }
                            }
                            if (validReason) {
                                API.sendChat(subChat(acidicBot.chat.usedlockskip, {
                                    name: chat.un
                                }));
                                acidicBot.roomUtilities.booth.lockBooth();
                                setTimeout(function(id) {
                                    API.moderateForceSkip();
                                    acidicBot.room.skippable = false;
                                    API.sendChat(msgSend);
                                    setTimeout(function() {
                                        acidicBot.room.skippable = true
                                    }, 5 * 1000);
                                    setTimeout(function(id) {
                                        acidicBot.userUtilities.moveUser(id, acidicBot.settings.lockskipPosition, false);
                                        acidicBot.room.queueable = true;
                                        setTimeout(function() {
                                            acidicBot.roomUtilities.booth.unlockBooth();
                                        }, 1000);
                                    }, 1500, id);
                                }, 1000, id);
                                return void(0);
                            }
                        }
                    }
                }
            },

            lockskipposCommand: {
                command: 'lockskippos',
                rank: 'manager',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        var pos = msg.substring(cmd.length + 1);
                        if (!isNaN(pos)) {
                            acidicBot.settings.lockskipPosition = pos;
                            return API.sendChat(subChat(acidicBot.chat.lockskippos, {
                                name: chat.un,
                                position: acidicBot.settings.lockskipPosition
                            }));
                        } else return API.sendChat(subChat(acidicBot.chat.invalidpositionspecified, {
                            name: chat.un
                        }));
                    }
                }
            },

            locktimerCommand: {
                command: 'locktimer',
                rank: 'manager',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        var lockTime = msg.substring(cmd.length + 1);
                        if (!isNaN(lockTime) && lockTime !== "") {
                            acidicBot.settings.maximumLocktime = lockTime;
                            return API.sendChat(subChat(acidicBot.chat.lockguardtime, {
                                name: chat.un,
                                time: acidicBot.settings.maximumLocktime
                            }));
                        } else return API.sendChat(subChat(acidicBot.chat.invalidtime, {
                            name: chat.un
                        }));
                    }
                }
            },

            logoutCommand: {
                command: 'logout',
                rank: 'manager',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        API.sendChat(subChat(acidicBot.chat.logout, {
                            name: chat.un,
                            botname: acidicBot.settings.botName
                        }));
                        setTimeout(function() {
                            $(".logout").mousedown()
                        }, 1000);
                    }
                }
            },

            maxlengthCommand: {
                command: 'maxlength',
                rank: 'manager',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        var maxTime = msg.substring(cmd.length + 1);
                        if (!isNaN(maxTime)) {
                            acidicBot.settings.maximumSongLength = maxTime;
                            return API.sendChat(subChat(acidicBot.chat.maxlengthtime, {
                                name: chat.un,
                                time: acidicBot.settings.maximumSongLength
                            }));
                        } else return API.sendChat(subChat(acidicBot.chat.invalidtime, {
                            name: chat.un
                        }));
                    }
                }
            },

            motdCommand: {
                command: 'motd',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        if (msg.length <= cmd.length + 1) return API.sendChat('/me MotD: ' + acidicBot.settings.motd);
                        var argument = msg.substring(cmd.length + 1);
                        if (!acidicBot.settings.motdEnabled) acidicBot.settings.motdEnabled = !acidicBot.settings.motdEnabled;
                        if (isNaN(argument)) {
                            acidicBot.settings.motd = argument;
                            API.sendChat(subChat(acidicBot.chat.motdset, {
                                msg: acidicBot.settings.motd
                            }));
                        } else {
                            acidicBot.settings.motdInterval = argument;
                            API.sendChat(subChat(acidicBot.chat.motdintervalset, {
                                interval: acidicBot.settings.motdInterval
                            }));
                        }
                    }
                }
            },

            moveCommand: {
                command: 'move',
                rank: 'mod',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(acidicBot.chat.nouserspecified, {
                            name: chat.un
                        }));
                        var firstSpace = msg.indexOf(' ');
                        var lastSpace = msg.lastIndexOf(' ');
                        var pos;
                        var name;
                        if (isNaN(parseInt(msg.substring(lastSpace + 1)))) {
                            pos = 1;
                            name = msg.substring(cmd.length + 2);
                        } else {
                            pos = parseInt(msg.substring(lastSpace + 1));
                            name = msg.substring(cmd.length + 2, lastSpace);
                        }
                        var user = acidicBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(acidicBot.chat.invaliduserspecified, {
                            name: chat.un
                        }));
                        if (user.id === acidicBot.loggedInID) return API.sendChat(subChat(acidicBot.chat.addbotwaitlist, {
                            name: chat.un
                        }));
                        if (!isNaN(pos)) {
                            API.sendChat(subChat(acidicBot.chat.move, {
                                name: chat.un
                            }));
                            acidicBot.userUtilities.moveUser(user.id, pos, false);
                        } else return API.sendChat(subChat(acidicBot.chat.invalidpositionspecified, {
                            name: chat.un
                        }));
                    }
                }
            },

            muteCommand: {
                command: 'mute',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(acidicBot.chat.nouserspecified, {
                            name: chat.un
                        }));
                        var lastSpace = msg.lastIndexOf(' ');
                        var time = null;
                        var name;
                        if (lastSpace === msg.indexOf(' ')) {
                            name = msg.substring(cmd.length + 2);
                            time = 45;
                        } else {
                            time = msg.substring(lastSpace + 1);
                            if (isNaN(time) || time == "" || time == null || typeof time == "undefined") {
                                return API.sendChat(subChat(acidicBot.chat.invalidtime, {
                                    name: chat.un
                                }));
                            }
                            name = msg.substring(cmd.length + 2, lastSpace);
                        }
                        var from = chat.un;
                        var user = acidicBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(acidicBot.chat.invaliduserspecified, {
                            name: chat.un
                        }));
                        var permFrom = acidicBot.userUtilities.getPermission(chat.uid);
                        var permUser = acidicBot.userUtilities.getPermission(user.id);
                        if (permFrom > permUser) {
                            if (time > 45) {
                                API.sendChat(subChat(acidicBot.chat.mutedmaxtime, {
                                    name: chat.un,
                                    time: "45"
                                }));
                                API.moderateMuteUser(user.id, 1, API.MUTE.LONG);
                            } else if (time === 45) {
                                API.moderateMuteUser(user.id, 1, API.MUTE.LONG);
                                API.sendChat(subChat(acidicBot.chat.mutedtime, {
                                    name: chat.un,
                                    username: name,
                                    time: time
                                }));

                            } else if (time > 30) {
                                API.moderateMuteUser(user.id, 1, API.MUTE.LONG);
                                API.sendChat(subChat(acidicBot.chat.mutedtime, {
                                    name: chat.un,
                                    username: name,
                                    time: time
                                }));
                                setTimeout(function(id) {
                                    API.moderateUnmuteUser(id);
                                }, time * 60 * 1000, user.id);
                            } else if (time > 15) {
                                API.moderateMuteUser(user.id, 1, API.MUTE.MEDIUM);
                                API.sendChat(subChat(acidicBot.chat.mutedtime, {
                                    name: chat.un,
                                    username: name,
                                    time: time
                                }));
                                setTimeout(function(id) {
                                    API.moderateUnmuteUser(id);
                                }, time * 60 * 1000, user.id);
                            } else {
                                API.moderateMuteUser(user.id, 1, API.MUTE.SHORT);
                                API.sendChat(subChat(acidicBot.chat.mutedtime, {
                                    name: chat.un,
                                    username: name,
                                    time: time
                                }));
                                setTimeout(function(id) {
                                    API.moderateUnmuteUser(id);
                                }, time * 60 * 1000, user.id);
                            }
                        } else API.sendChat(subChat(acidicBot.chat.muterank, {
                            name: chat.un
                        }));
                    }
                }
            },

            opCommand: {
                command: 'op',
                rank: 'user',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (typeof acidicBot.settings.opLink === "string")
                            return API.sendChat(subChat(acidicBot.chat.oplist, {
                                link: acidicBot.settings.opLink
                            }));
                    }
                }
            },

            pingCommand: {
                command: 'ping',
                rank: 'user',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        API.sendChat(acidicBot.chat.pong)
                    }
                }
            },

            refreshCommand: {
                command: 'refresh',
                rank: 'manager',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        sendToSocket();
                        storeToStorage();
                        acidicBot.disconnectAPI();
                        setTimeout(function() {
                            window.location.reload(false);
                        }, 1000);

                    }
                }
            },

            reloadCommand: {
                command: 'reload',
                rank: 'bouncer',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        API.sendChat(acidicBot.chat.reload);
                        sendToSocket();
                        storeToStorage();
                        acidicBot.disconnectAPI();
                        kill();
                        setTimeout(function() {
                            $.getScript(acidicBot.scriptLink);
                        }, 2000);
                    }
                }
            },

            removeCommand: {
                command: 'remove',
                rank: 'mod',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        if (msg.length > cmd.length + 2) {
                            var name = msg.substr(cmd.length + 2);
                            var user = acidicBot.userUtilities.lookupUserName(name);
                            if (typeof user !== 'boolean') {
                                user.lastDC = {
                                    time: null,
                                    position: null,
                                    songCount: 0
                                };
                                if (API.getDJ().id === user.id) {
                                    API.moderateForceSkip();
                                    setTimeout(function() {
                                        API.moderateRemoveDJ(user.id);
                                    }, 1 * 1000, user);
                                } else API.moderateRemoveDJ(user.id);
                            } else API.sendChat(subChat(acidicBot.chat.removenotinwl, {
                                name: chat.un,
                                username: name
                            }));
                        } else API.sendChat(subChat(acidicBot.chat.nouserspecified, {
                            name: chat.un
                        }));
                    }
                }
            },

            restrictetaCommand: {
                command: 'restricteta',
                rank: 'bouncer',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (acidicBot.settings.etaRestriction) {
                            acidicBot.settings.etaRestriction = !acidicBot.settings.etaRestriction;
                            return API.sendChat(subChat(acidicBot.chat.toggleoff, {
                                name: chat.un,
                                'function': acidicBot.chat.etarestriction
                            }));
                        } else {
                            acidicBot.settings.etaRestriction = !acidicBot.settings.etaRestriction;
                            return API.sendChat(subChat(acidicBot.chat.toggleon, {
                                name: chat.un,
                                'function': acidicBot.chat.etarestriction
                            }));
                        }
                    }
                }
            },

            rouletteCommand: {
                command: 'roulette',
                rank: 'mod',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (!acidicBot.room.roulette.rouletteStatus) {
                            acidicBot.room.roulette.startRoulette();
                        }
                    }
                }
            },

            rulesCommand: {
                command: 'rules',
                rank: 'user',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (typeof acidicBot.settings.rulesLink === "string")
                            return API.sendChat(subChat(acidicBot.chat.roomrules, {
                                link: acidicBot.settings.rulesLink
                            }));
                    }
                }
            },

            sessionstatsCommand: {
                command: 'sessionstats',
                rank: 'bouncer',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var from = chat.un;
                        var woots = acidicBot.room.roomstats.totalWoots;
                        var mehs = acidicBot.room.roomstats.totalMehs;
                        var grabs = acidicBot.room.roomstats.totalCurates;
                        API.sendChat(subChat(acidicBot.chat.sessionstats, {
                            name: from,
                            woots: woots,
                            mehs: mehs,
                            grabs: grabs
                        }));
                    }
                }
            },

            skipCommand: {
                command: 'skip',
                rank: 'bouncer',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        API.sendChat(subChat(acidicBot.chat.skip, {
                            name: chat.un
                        }));
                        API.moderateForceSkip();
                        acidicBot.room.skippable = false;
                        setTimeout(function() {
                            acidicBot.room.skippable = true
                        }, 5 * 1000);

                    }
                }
            },

            songstatsCommand: {
                command: 'songstats',
                rank: 'mod',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (acidicBot.settings.songstats) {
                            acidicBot.settings.songstats = !acidicBot.settings.songstats;
                            return API.sendChat(subChat(acidicBot.chat.toggleoff, {
                                name: chat.un,
                                'function': acidicBot.chat.songstats
                            }));
                        } else {
                            acidicBot.settings.songstats = !acidicBot.settings.songstats;
                            return API.sendChat(subChat(acidicBot.chat.toggleon, {
                                name: chat.un,
                                'function': acidicBot.chat.songstats
                            }));
                        }
                    }
                }
            },

            sourceCommand: {
                command: 'source',
                rank: 'user',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        API.sendChat('/me This bot was created by ' + botCreator + ', but is now maintained by ' + botMaintainer + ".");
                    }
                }
            },

            statusCommand: {
                command: 'status',
                rank: 'bouncer',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var from = chat.un;
                        var msg = '[@' + from + '] ';

                        msg += acidicBot.chat.afkremoval + ': ';
                        if (acidicBot.settings.afkRemoval) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';
                        msg += acidicBot.chat.afksremoved + ": " + acidicBot.room.afkList.length + '. ';
                        msg += acidicBot.chat.afklimit + ': ' + acidicBot.settings.maximumAfk + '. ';

                        msg += 'Bouncer+: ';
                        if (acidicBot.settings.bouncerPlus) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += acidicBot.chat.blacklist + ': ';
                        if (acidicBot.settings.blacklistEnabled) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += acidicBot.chat.lockguard + ': ';
                        if (acidicBot.settings.lockGuard) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += acidicBot.chat.cycleguard + ': ';
                        if (acidicBot.settings.cycleGuard) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += acidicBot.chat.timeguard + ': ';
                        if (acidicBot.settings.timeGuard) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += acidicBot.chat.chatfilter + ': ';
                        if (acidicBot.settings.filterChat) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += acidicBot.chat.historyskip + ': ';
                        if (acidicBot.settings.historySkip) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += acidicBot.chat.voteskip + ': ';
                        if (acidicBot.settings.voteSkip) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += acidicBot.chat.cmddeletion + ': ';
                        if (acidicBot.settings.cmdDeletion) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += acidicBot.chat.autoskip + ': ';
                        if (acidicBot.room.autoskip) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        var launchT = acidicBot.room.roomstats.launchTime;
                        var durationOnline = Date.now() - launchT;
                        var since = acidicBot.roomUtilities.msToStr(durationOnline);
                        msg += subChat(acidicBot.chat.activefor, {
                            time: since
                        });

                        if (msg.length > 241) {
                            var split = msg.match(/.{1,241}/g);
                            for (var i = 0; i < split.length; i++) {
                                var func = function(index) {
                                    setTimeout(function() {
                                        API.sendChat("/me " + split[index]);
                                    }, 500 * index);
                                }
                                func(i);
                            }
                        } else {
                            return API.sendChat(msg);
                        }
                    }
                }
            },

            swapCommand: {
                command: 'swap',
                rank: 'mod',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(acidicBot.chat.nouserspecified, {
                            name: chat.un
                        }));
                        var firstSpace = msg.indexOf(' ');
                        var lastSpace = msg.lastIndexOf(' ');
                        var name1 = msg.substring(cmd.length + 2, lastSpace);
                        var name2 = msg.substring(lastSpace + 2);
                        var user1 = acidicBot.userUtilities.lookupUserName(name1);
                        var user2 = acidicBot.userUtilities.lookupUserName(name2);
                        if (typeof user1 === 'boolean' || typeof user2 === 'boolean') return API.sendChat(subChat(acidicBot.chat.swapinvalid, {
                            name: chat.un
                        }));
                        if (user1.id === acidicBot.loggedInID || user2.id === acidicBot.loggedInID) return API.sendChat(subChat(acidicBot.chat.addbottowaitlist, {
                            name: chat.un
                        }));
                        var p1 = API.getWaitListPosition(user1.id) + 1;
                        var p2 = API.getWaitListPosition(user2.id) + 1;
                        if (p1 < 0 || p2 < 0) return API.sendChat(subChat(acidicBot.chat.swapwlonly, {
                            name: chat.un
                        }));
                        API.sendChat(subChat(acidicBot.chat.swapping, {
                            'name1': name1,
                            'name2': name2
                        }));
                        if (p1 < p2) {
                            acidicBot.userUtilities.moveUser(user2.id, p1, false);
                            setTimeout(function(user1, p2) {
                                acidicBot.userUtilities.moveUser(user1.id, p2, false);
                            }, 2000, user1, p2);
                        } else {
                            acidicBot.userUtilities.moveUser(user1.id, p2, false);
                            setTimeout(function(user2, p1) {
                                acidicBot.userUtilities.moveUser(user2.id, p1, false);
                            }, 2000, user2, p1);
                        }
                    }
                }
            },

            themeCommand: {
                command: 'theme',
                rank: 'user',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (typeof acidicBot.settings.themeLink === "string")
                            API.sendChat(subChat(acidicBot.chat.genres, {
                                link: acidicBot.settings.themeLink
                            }));
                    }
                }
            },

            timeguardCommand: {
                command: 'timeguard',
                rank: 'bouncer',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (acidicBot.settings.timeGuard) {
                            acidicBot.settings.timeGuard = !acidicBot.settings.timeGuard;
                            return API.sendChat(subChat(acidicBot.chat.toggleoff, {
                                name: chat.un,
                                'function': acidicBot.chat.timeguard
                            }));
                        } else {
                            acidicBot.settings.timeGuard = !acidicBot.settings.timeGuard;
                            return API.sendChat(subChat(acidicBot.chat.toggleon, {
                                name: chat.un,
                                'function': acidicBot.chat.timeguard
                            }));
                        }

                    }
                }
            },

            toggleblCommand: {
                command: 'togglebl',
                rank: 'bouncer',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var temp = acidicBot.settings.blacklistEnabled;
                        acidicBot.settings.blacklistEnabled = !temp;
                        if (acidicBot.settings.blacklistEnabled) {
                            return API.sendChat(subChat(acidicBot.chat.toggleon, {
                                name: chat.un,
                                'function': acidicBot.chat.blacklist
                            }));
                        } else return API.sendChat(subChat(acidicBot.chat.toggleoff, {
                            name: chat.un,
                            'function': acidicBot.chat.blacklist
                        }));
                    }
                }
            },

            togglemotdCommand: {
                command: 'togglemotd',
                rank: 'bouncer',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (acidicBot.settings.motdEnabled) {
                            acidicBot.settings.motdEnabled = !acidicBot.settings.motdEnabled;
                            API.sendChat(subChat(acidicBot.chat.toggleoff, {
                                name: chat.un,
                                'function': acidicBot.chat.motd
                            }));
                        } else {
                            acidicBot.settings.motdEnabled = !acidicBot.settings.motdEnabled;
                            API.sendChat(subChat(acidicBot.chat.toggleon, {
                                name: chat.un,
                                'function': acidicBot.chat.motd
                            }));
                        }
                    }
                }
            },

            togglevoteskipCommand: {
                command: 'togglevoteskip',
                rank: 'bouncer',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (acidicBot.settings.voteSkip) {
                            acidicBot.settings.voteSkip = !acidicBot.settings.voteSkip;
                            API.sendChat(subChat(acidicBot.chat.toggleoff, {
                                name: chat.un,
                                'function': acidicBot.chat.voteskip
                            }));
                        } else {
                            acidicBot.settings.voteSkip = !acidicBot.settings.voteSkip;
                            API.sendChat(subChat(acidicBot.chat.toggleon, {
                                name: chat.un,
                                'function': acidicBot.chat.voteskip
                            }));
                        }
                    }
                }
            },

            unbanCommand: {
                command: 'unban',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        $(".icon-population").click();
                        $(".icon-ban").click();
                        setTimeout(function(chat) {
                            var msg = chat.message;
                            if (msg.length === cmd.length) return API.sendChat();
                            var name = msg.substring(cmd.length + 2);
                            var bannedUsers = API.getBannedUsers();
                            var found = false;
                            var bannedUser = null;
                            for (var i = 0; i < bannedUsers.length; i++) {
                                var user = bannedUsers[i];
                                if (user.username === name) {
                                    bannedUser = user;
                                    found = true;
                                }
                            }
                            if (!found) {
                                $(".icon-chat").click();
                                return API.sendChat(subChat(acidicBot.chat.notbanned, {
                                    name: chat.un
                                }));
                            }
                            API.moderateUnbanUser(bannedUser.id);
                            console.log("Unbanned " + name);
                            setTimeout(function() {
                                $(".icon-chat").click();
                            }, 1000);
                        }, 1000, chat);
                    }
                }
            },

            unlockCommand: {
                command: 'unlock',
                rank: 'mod',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        acidicBot.roomUtilities.booth.unlockBooth();
                    }
                }
            },

            unmuteCommand: {
                command: 'unmute',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        var permFrom = acidicBot.userUtilities.getPermission(chat.uid);
                        var from = chat.un;
                        var name = msg.substr(cmd.length + 2);

                        var user = acidicBot.userUtilities.lookupUserName(name);

                        if (typeof user === 'boolean') return API.sendChat(subChat(acidicBot.chat.invaliduserspecified, {
                            name: chat.un
                        }));

                        var permUser = acidicBot.userUtilities.getPermission(user.id);
                        if (permFrom > permUser) {
                            try {
                                API.moderateUnmuteUser(user.id);
                                API.sendChat(subChat(acidicBot.chat.unmuted, {
                                    name: chat.un,
                                    username: name
                                }));
                            } catch (e) {
                                API.sendChat(subChat(acidicBot.chat.notmuted, {
                                    name: chat.un
                                }));
                            }
                        } else API.sendChat(subChat(acidicBot.chat.unmuterank, {
                            name: chat.un
                        }));
                    }
                }
            },

            usercmdcdCommand: {
                command: 'usercmdcd',
                rank: 'manager',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        var cd = msg.substring(cmd.length + 1);
                        if (!isNaN(cd)) {
                            acidicBot.settings.commandCooldown = cd;
                            return API.sendChat(subChat(acidicBot.chat.commandscd, {
                                name: chat.un,
                                time: acidicBot.settings.commandCooldown
                            }));
                        } else return API.sendChat(subChat(acidicBot.chat.invalidtime, {
                            name: chat.un
                        }));
                    }
                }
            },

            usercommandsCommand: {
                command: 'usercommands',
                rank: 'manager',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (acidicBot.settings.usercommandsEnabled) {
                            API.sendChat(subChat(acidicBot.chat.toggleoff, {
                                name: chat.un,
                                'function': acidicBot.chat.usercommands
                            }));
                            acidicBot.settings.usercommandsEnabled = !acidicBot.settings.usercommandsEnabled;
                        } else {
                            API.sendChat(subChat(acidicBot.chat.toggleon, {
                                name: chat.un,
                                'function': acidicBot.chat.usercommands
                            }));
                            acidicBot.settings.usercommandsEnabled = !acidicBot.settings.usercommandsEnabled;
                        }
                    }
                }
            },

            voteratioCommand: {
                command: 'voteratio',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(acidicBot.chat.nouserspecified, {
                            name: chat.un
                        }));
                        var name = msg.substring(cmd.length + 2);
                        var user = acidicBot.userUtilities.lookupUserName(name);
                        if (user === false) return API.sendChat(subChat(acidicBot.chat.invaliduserspecified, {
                            name: chat.un
                        }));
                        var vratio = user.votes;
                        var ratio = vratio.woot / vratio.meh;
                        API.sendChat(subChat(acidicBot.chat.voteratio, {
                            name: chat.un,
                            username: name,
                            woot: vratio.woot,
                            mehs: vratio.meh,
                            ratio: ratio.toFixed(2)
                        }));
                    }
                }
            },

            voteskipCommand: {
                command: 'voteskip',
                rank: 'manager',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        if (msg.length <= cmd.length + 1) return API.sendChat(subChat(acidicBot.chat.voteskiplimit, {
                            name: chat.un,
                            limit: acidicBot.settings.voteSkipLimit
                        }));
                        var argument = msg.substring(cmd.length + 1);
                        if (!acidicBot.settings.voteSkip) acidicBot.settings.voteSkip = !acidicBot.settings.voteSkip;
                        if (isNaN(argument)) {
                            API.sendChat(subChat(acidicBot.chat.voteskipinvalidlimit, {
                                name: chat.un
                            }));
                        } else {
                            acidicBot.settings.voteSkipLimit = argument;
                            API.sendChat(subChat(acidicBot.chat.voteskipsetlimit, {
                                name: chat.un,
                                limit: acidicBot.settings.voteSkipLimit
                            }));
                        }
                    }
                }
            },

            welcomeCommand: {
                command: 'welcome',
                rank: 'mod',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (acidicBot.settings.welcome) {
                            acidicBot.settings.welcome = !acidicBot.settings.welcome;
                            return API.sendChat(subChat(acidicBot.chat.toggleoff, {
                                name: chat.un,
                                'function': acidicBot.chat.welcomemsg
                            }));
                        } else {
                            acidicBot.settings.welcome = !acidicBot.settings.welcome;
                            return API.sendChat(subChat(acidicBot.chat.toggleon, {
                                name: chat.un,
                                'function': acidicBot.chat.welcomemsg
                            }));
                        }
                    }
                }
            },

            websiteCommand: {
                command: 'website',
                rank: 'user',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (typeof acidicBot.settings.website === "string")
                            API.sendChat(subChat(acidicBot.chat.website, {
                                link: acidicBot.settings.website
                            }));
                    }
                }
            },

            whoisCommand: {
                command: 'whois',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        var name;
                        if (msg.length === cmd.length) name = chat.un;
                        else {
                            name = msg.substr(cmd.length + 2);
                        }
                        users = API.getUsers();
                        var len = users.length;
                        for (var i = 0; i < len; ++i) {
                            if (users[i].username == name) {
                                var id = users[i].id;
                                var avatar = API.getUser(id).avatarID;
                                var level = API.getUser(id).level;
                                var rawjoined = API.getUser(id).joined;
                                var joined = rawjoined.substr(0, 10);
                                var rawlang = API.getUser(id).language;
                                if (rawlang == "en") {
                                    var language = "English";
                                } else if (rawlang == "bg") {
                                    var language = "Bulgarian";
                                } else if (rawlang == "cs") {
                                    var language = "Czech";
                                } else if (rawlang == "fi") {
                                    var language = "Finnish"
                                } else if (rawlang == "fr") {
                                    var language = "French"
                                } else if (rawlang == "pt") {
                                    var language = "Portuguese"
                                } else if (rawlang == "zh") {
                                    var language = "Chinese"
                                } else if (rawlang == "sk") {
                                    var language = "Slovak"
                                } else if (rawlang == "nl") {
                                    var language = "Dutch"
                                } else if (rawlang == "ms") {
                                    var language = "Malay"
                                }
                                var rawstatus = API.getUser(id).status;
                                if (rawstatus == "0") {
                                    var status = "Available";
                                } else if (rawstatus == "1") {
                                    var status = "Away";
                                } else if (rawstatus == "2") {
                                    var status = "Working";
                                } else if (rawstatus == "3") {
                                    var status = "Gaming"
                                }
                                var rawrank = API.getUser(id).role;
                                if (rawrank == "0") {
                                    var rank = "User";
                                } else if (rawrank == "1") {
                                    var rank = "Resident DJ";
                                } else if (rawrank == "2") {
                                    var rank = "Bouncer";
                                } else if (rawrank == "3") {
                                    var rank = "Manager"
                                } else if (rawrank == "4") {
                                    var rank = "Co-Host"
                                } else if (rawrank == "5") {
                                    var rank = "Host"
                                } else if (rawrank == "7") {
                                    var rank = "Brand Ambassador"
                                } else if (rawrank == "10") {
                                    var rank = "Admin"
                                }
                                var slug = API.getUser(id).slug;
                                if (typeof slug !== 'undefined') {
                                    var profile = ", Profile: http://plug.dj/@/" + slug;
                                } else {
                                    var profile = "";
                                }

                                API.sendChat(subChat(acidicBot.chat.whois, {
                                    name1: chat.un,
                                    name2: name,
                                    id: id,
                                    avatar: avatar,
                                    profile: profile,
                                    language: language,
                                    level: level,
                                    status: status,
                                    joined: joined,
                                    rank: rank
                                }));
                            }
                        }
                    }
                }
            },

            youtubeCommand: {
                command: 'youtube',
                rank: 'user',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!acidicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (typeof acidicBot.settings.youtubeLink === "string")
                            API.sendChat(subChat(acidicBot.chat.youtube, {
                                name: chat.un,
                                link: acidicBot.settings.youtubeLink
                            }));
                    }
                }
            }
        }
    };

    loadChat(acidicBot.startup);
}).call(this);
