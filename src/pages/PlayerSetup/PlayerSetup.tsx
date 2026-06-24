import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCleanup } from '../../hooks/useCleanup';
import { authenticate, getNakamaSocket, getSession, disconnectSocket, ensureSocketConnected } from '../../services/nakama';
import { playMatchmakingScrollSound, playMatchFoundSound } from '../../utils/audio';
import type { MatchmakerMatched } from '@heroiclabs/nakama-js';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import styles from './PlayerSetup.module.css';

import profileBg from '../../Atlas_Lobby/images/profile_bg_blue.png';
import profileRound from '../../Atlas_Lobby/images/profile_round_blue.png';
import profileBgYellow from '../../Atlas_Lobby/images/profile_bg_yelllow.png'; // 3 l's!
import profileRoundYellow from '../../Atlas_Lobby/images/profile_round_yellow.png';
import profileOuterGlowYellow from '../../Atlas_Lobby/images/profile_outer_glow_yellow.png';
import vsImg from '../../Atlas_Lobby/images/vs.png';
import vsAfterEffectImg from '../../Atlas_Lobby/images/vs_after_effect_2.png';

import logoImg from '../../Atlas_Lobby/images/logo.png';
import playBtnImg from '../../Atlas_Lobby/images/Playblue.png';
import timerIconImg from '../../Atlas_Lobby/images/timmer.png';

type TUserProfile = {
  userId: string;
  userName: string;
  email: string;
  isbot: boolean;
  user_skill: string;
  user_level: number;
  avatar_url: string;
  gamethumbnailurl: string;
  canPlay: boolean;
};

// Import all images inside src/assets/LobbyAvatars
const lobbyAvatarModules = import.meta.glob<{ default: string }>('../../assets/LobbyAvatars/*.png', { eager: true });
const lobbyAvatarsList = Object.values(lobbyAvatarModules).map((mod) => mod.default);

// Generate unique shifted/offset avatar lists to prevent identical patterns when multiple search boxes scroll
const getShiftedAvatars = (index: number): string[] => {
  const offsets = [0, 7, 13];
  const offset = offsets[index % offsets.length];
  const shifted = [
    ...lobbyAvatarsList.slice(offset),
    ...lobbyAvatarsList.slice(0, offset)
  ];
  return [...shifted, ...shifted]; // Duplicate list for seamless infinite loop scroll
};

function PlayerSetup() {
  const [currentUser, setCurrentUser] = useState<TUserProfile | null>(() => {
    const stored = localStorage.getItem('ludo_user');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [playerCount, setPlayerCount] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimer, setSearchTimer] = useState<number | null>(null);
  const [matchFound, setMatchFound] = useState(false);
  const [opponentName, setOpponentName] = useState('Searching...');
  const [opponentAvatar, setOpponentAvatar] = useState('');
  const [opponents, setOpponents] = useState<{ name: string; avatarUrl: string }[]>([]);
  const [visibleOpponentsCount, setVisibleOpponentsCount] = useState(0);
  const [countdown, setCountdown] = useState<number | string | null>(null);
  const [isConnectingSocket, setIsConnectingSocket] = useState(false);

  const ticketRef = useRef<string>('');
  const navigate = useNavigate();
  const cleanup = useCleanup();

  // Redirect to landing if no logged in user
  useEffect(() => {
    if (!currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  // Automatically authenticate if we have currentUser stored but socket/session is not initialized
  useEffect(() => {
    if (currentUser && !getSession()) {
      const reauth = async () => {
        setIsConnectingSocket(true);
        try {
          await authenticate(currentUser.userId, currentUser.userName);
        } catch (e: any) {
          console.error("Auto-reauthentication failed:", e);
          toast.error("Failed to connect to game server. Please log in again.");
          localStorage.removeItem('ludo_user');
          setCurrentUser(null);
          navigate('/');
        } finally {
          setIsConnectingSocket(false);
        }
      };
      reauth();
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    document.title = 'LOOSER LUDO - Player Setup';
    cleanup();
    toast.dismiss();
  }, [cleanup]);

  useEffect(() => {
    // Play scrolling sound while searching
    playMatchmakingScrollSound(isSearching && !matchFound);
    return () => playMatchmakingScrollSound(false);
  }, [isSearching, matchFound]);

  useEffect(() => {
    if (matchFound) {
      playMatchFoundSound();
    }
  }, [matchFound]);



  // Handle Nakama matchmaking flow
  useEffect(() => {
    if (!isSearching) return;

    const SIMULATE_MATCHMAKING = false; // Toggle to true to test UI transitions, false for actual socket play
    if (SIMULATE_MATCHMAKING) {
      const timer = setTimeout(() => {
        if (playerCount === 4) {
          const simulatedOpponents = [
            { name: 'NovaRush', avatarUrl: lobbyAvatarsList[1] || '' },
            { name: 'ZenoFly', avatarUrl: lobbyAvatarsList[2] || '' },
            { name: 'RexStorm', avatarUrl: lobbyAvatarsList[3] || '' }
          ];
          setOpponents(simulatedOpponents);
          setVisibleOpponentsCount(0);
          
          let count = 0;
          const staggerInterval = setInterval(() => {
            count++;
            setVisibleOpponentsCount(count);
            try { playMatchFoundSound(); } catch (e) {}

            if (count === 3) {
              clearInterval(staggerInterval);
              setMatchFound(true);
              setCountdown(3);

              let counter = 3;
              const countInterval = setInterval(() => {
                counter--;
                if (counter < 0) {
                  clearInterval(countInterval);
                  setIsSearching(false);
                  setMatchFound(false);
                  setCountdown(null);
                  navigate('/play', {
                    state: {
                      isOnline: false,
                      initData: [
                        { name: currentUser?.userName || 'Player 1', isBot: false, avatarUrl: currentUser?.avatar_url },
                        { name: 'NovaRush', isBot: true, avatarUrl: lobbyAvatarsList[1] || '' },
                        { name: 'ZenoFly', isBot: true, avatarUrl: lobbyAvatarsList[2] || '' },
                        { name: 'RexStorm', isBot: true, avatarUrl: lobbyAvatarsList[3] || '' }
                      ]
                    }
                  });
                } else if (counter === 0) {
                  setCountdown("Let's Play!");
                } else {
                  setCountdown(counter);
                }
              }, 1000);
            }
          }, 1200);

        } else {
          setOpponentName('NovaRush');
          setOpponentAvatar(lobbyAvatarsList[1] || '');
          setOpponents([{ name: 'NovaRush', avatarUrl: lobbyAvatarsList[1] || '' }]);
          setVisibleOpponentsCount(1);
          setMatchFound(true);
          setCountdown(3);

          let counter = 3;
          const countInterval = setInterval(() => {
            counter--;
            if (counter < 0) {
              clearInterval(countInterval);
              setIsSearching(false);
              setMatchFound(false);
              setCountdown(null);
              navigate('/play', {
                state: {
                  isOnline: false,
                  initData: [
                    { name: currentUser?.userName || 'Player 1', isBot: false, avatarUrl: currentUser?.avatar_url },
                    { name: 'NovaRush', isBot: true, avatarUrl: lobbyAvatarsList[1] || '' }
                  ]
                }
              });
            } else if (counter === 0) {
              setCountdown("Let's Play!");
            } else {
              setCountdown(counter);
            }
          }, 1000);
        }
      }, 3000);

      return () => clearTimeout(timer);
    }

    try {
      getNakamaSocket();
    } catch (e) {
      toast.error("Nakama connection lost. Redirecting to login.");
      setIsSearching(false);
      navigate('/');
      return;
    }

    const startMatchmaking = async () => {
      try {
        const activeSocket = await ensureSocketConnected();

        activeSocket.onmatchmakermatched = (matched: MatchmakerMatched) => {
          // DEBUGGING: log the full matched object
          console.log("=== MATCHMAKER MATCHED ===");
          console.log("matched.match_id:", matched.match_id);
          console.log("matched.matchId (camelCase):", (matched as any).matchId);
          console.log("matched.token:", matched.token);
          console.log("matched.ticket:", matched.ticket);
          console.log("Full matched object:", JSON.stringify(matched));

          // Try every possible location for the match_id.
          // If the SDK did not return a match_id, this is a relay match. Do not extract matchId from token!
          const resolvedMatchId: string =
            matched.match_id ||
            (matched as any).matchId ||
            (matched as any).match_id ||
            '';

          console.log("=== RESOLVED matchId:", resolvedMatchId, "===");

          const targetMinSize = playerCount === 4 ? 4 : 2;
          if (!matched.users || matched.users.length < targetMinSize) {
            console.warn(`[MATCHMAKER] Matched fewer than ${targetMinSize} players. Re-entering matchmaking queue...`);
            toast.info("Waiting for all players... resuming search.");
            startMatchmaking();
            return;
          }

          const opponentsList = matched.users
            .filter((u) => u.presence.session_id !== matched.self.presence.session_id)
            .map((opponent, idx) => {
              const opName = opponent.string_properties?.name || 
                             opponent.string_properties?.userName || 
                             opponent.presence.username || 
                             (`Opponent ${idx + 1}`);
              const opAvatar = opponent.string_properties?.avatarurl || 
                               opponent.string_properties?.avatarUrl || 
                               opponent.string_properties?.avatar_url || 
                               lobbyAvatarsList[idx % lobbyAvatarsList.length] || '';
              return { name: opName, avatarUrl: opAvatar };
            });

          setOpponents(opponentsList);
          
          // CRITICAL: Clear ticket BEFORE navigating so the useEffect cleanup
          // does NOT call removeMatchmaker (which would break the server match)
          ticketRef.current = '';

          const runCountdown = () => {
            let counter = 3;
            const countInterval = setInterval(() => {
              counter--;
              if (counter < 0) {
                clearInterval(countInterval);
                navigate('/play', {
                  state: {
                    isOnline: true,
                    matchId: resolvedMatchId,        // Authoritative match ID (empty if server failed)
                    matchedToken: matched.token,      // Relay token (fallback when matchId is empty)
                    matchedUsers: matched.users,      // Player list for relay host initialization
                    myPlayerId: matched.self.presence.session_id,
                    myUserId: getSession()?.user_id || currentUser?.userId,
                    canonicalColour: 'blue'
                  }
                });
              } else if (counter === 0) {
                setCountdown("Let's Play!");
              } else {
                setCountdown(counter);
              }
            }, 1000);
          };

          if (playerCount === 4) {
            setVisibleOpponentsCount(0);
            let count = 0;
            const staggerInterval = setInterval(() => {
              count++;
              setVisibleOpponentsCount(count);
              try { playMatchFoundSound(); } catch (e) {}

              if (count === 3) {
                clearInterval(staggerInterval);
                setMatchFound(true);
                setCountdown(3);
                runCountdown();
              }
            }, 1200);
          } else {
            if (opponentsList.length > 0) {
              setOpponentName(opponentsList[0].name);
              setOpponentAvatar(opponentsList[0].avatarUrl);
            }
            setVisibleOpponentsCount(1);
            setMatchFound(true);
            setCountdown(3);
            runCountdown();
          }
        };

        const minCount = playerCount === 4 ? 4 : 2;
        const maxCount = playerCount === 4 ? 4 : 2;
        const matchSizeStr = playerCount === 4 ? '4' : '2';

        const res = await activeSocket.addMatchmaker(
          `+properties.matchSize:${matchSizeStr}`,
          minCount,
          maxCount,
          {
            matchSize: matchSizeStr,
            name: currentUser?.userName || '',
            userName: currentUser?.userName || '',
            avatarUrl: currentUser?.avatar_url || '',
            avatar_url: currentUser?.avatar_url || '',
            level: (currentUser?.user_level || 1).toString()
          }
        );

        ticketRef.current = res.ticket;
      } catch (err: any) {
        console.error("Matchmaking error:", err);
        toast.error("Failed to start matchmaking: " + err.message);
        setIsSearching(false);
      }
    };

    startMatchmaking();

    return () => {
      // Remove matchmaker if searching is stopped before matching
      const ticket = ticketRef.current;
      if (ticket) {
        try {
          getNakamaSocket().removeMatchmaker(ticket);
        } catch (e) { }
      }
    };
  }, [isSearching, currentUser, navigate]);

  const handleSelectMode = (count: number) => {
    if (isSearching || matchFound) return;
    setPlayerCount(count);
  };

  const handlePlayBtnClick = () => {
    if (playerCount === null) return;
    
    // Start search
    setOpponents([]);
    setVisibleOpponentsCount(0);
    setOpponentName('Searching...');
    setMatchFound(false);
    playMatchmakingScrollSound(true); // Instant audio start on click
    setIsSearching(true);
  };

  const handleCancelSearch = useCallback(async () => {
    const ticket = ticketRef.current;
    if (ticket) {
      try {
        await getNakamaSocket().removeMatchmaker(ticket);
      } catch (e) { }
    }
    ticketRef.current = '';
    setIsSearching(false);
    setMatchFound(false);
    setOpponents([]);
    setVisibleOpponentsCount(0);
  }, []);

  // Matchmaking timer countdown effect
  useEffect(() => {
    if (!isSearching || matchFound) {
      setSearchTimer(null);
      return;
    }

    const initialTime = playerCount === 4 ? 45 : 30;
    setSearchTimer(initialTime);

    const interval = setInterval(() => {
      setSearchTimer((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(interval);
          handleCancelSearch();
          toast.warning('Matchmaking timed out. No players found. Please try again.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSearching, matchFound, playerCount, handleCancelSearch]);

  const formatTimer = (seconds: number | null): string => {
    if (seconds === null) return '';
    const secsStr = seconds < 10 ? `0${seconds}` : `${seconds}`;
    return `00:${secsStr}`;
  };

  const handleLogout = () => {
    localStorage.removeItem('ludo_user');
    disconnectSocket();
    setCurrentUser(null);
    navigate('/');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && matchFound && playerCount !== null) {
        e.preventDefault();
        handlePlayBtnClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [matchFound, playerCount, navigate]);

  if (!currentUser) return null;

  return (
    <div className={styles.playerSetup}>
      {/* Background Spotlight */}
      <div className={styles.spotlight}></div>

      <main className={styles.playerSetupDialog}>
        {/* Matchmaking Timer */}
        {isSearching && searchTimer !== null && (
          <div className={styles.lobbyTimerContainer}>
            <img src={timerIconImg} alt="Timer Icon" className={styles.lobbyTimerIcon} />
            <span className={styles.lobbyTimerText}>{formatTimer(searchTimer)}</span>
          </div>
        )}

        {/* Logo */}
        <div className={styles.logoContainer}>
          <img src={logoImg} alt="Looser Ludo Logo" className={styles.logoImage} />
        </div>

        {/* Players Area (VS match state) */}
        <div className={styles.matchmakingArea}>
          {/* Blue Local Player Card */}
          <div className={`${styles.profileContainer} ${isSearching ? styles.searchingBlue : ''}`}>
            <img src={profileBg} alt="Profile Background" className={styles.profileBgImage} />
            <div className={styles.profileContent}>
              <span className={styles.playerName}>{currentUser.userName}</span>

              <div className={styles.avatarWrapper}>
                <div className={styles.avatarCircle}>
                  <img src={profileRound} alt="Round Ring" className={styles.avatarRing} />
                  <img src={currentUser.avatar_url} alt="Avatar" className={styles.avatarImage} />
                </div>
              </div>
            </div>
            {/* Sign Out Badge */}
            {!isSearching && (
              <button onClick={handleLogout} className={styles.signOutBtn} title="Sign Out">
                &times;
              </button>
            )}
          </div>

          {/* VS & Opponent Yellow Card when searching */}
          {isSearching && (
            <>
              <div className={styles.vsContainer}>
                <img src={vsImg} alt="VS" className={`${styles.vsImage} ${matchFound ? styles.vsFlash : ''}`} />
                {matchFound && (
                  <>
                    <img src={vsAfterEffectImg} alt="VS Effect" className={styles.vsAfterEffect} />
                    <div className={styles.vsSparkLine} />
                  </>
                )}
              </div>

              {playerCount === 4 ? (
                /* 4 Players Matchmaking Bottom Card */
                <div className={styles.profileContainerYellow4}>
                  <img src={profileBgYellow} alt="Profile Background Yellow" className={styles.profileBgImage} />
                  <div className={styles.profileContentYellow4}>
                    {[0, 1, 2].map((idx) => {
                      const isMatchedThisSlot = idx < visibleOpponentsCount;
                      const opp = opponents[idx];
                      const oppName = (isMatchedThisSlot && opp) ? opp.name : 'Searching...';
                      const oppAvatar = (isMatchedThisSlot && opp) ? opp.avatarUrl : null;
                      
                      let ringFilterClass = '';
                      if (idx === 1) ringFilterClass = styles.ringRed;
                      else if (idx === 2) ringFilterClass = styles.ringGreen;

                      return (
                        <div key={idx} className={styles.opponentSlot}>
                          <div className={styles.avatarWrapperSmall}>
                            {isMatchedThisSlot && (
                              <img src={profileOuterGlowYellow} className={styles.avatarGlowYellow} alt="Glow" />
                            )}
                            <div className={styles.avatarCircleSmall}>
                              <img 
                                src={profileRoundYellow} 
                                alt={`Round Ring Opponent ${idx + 1}`} 
                                className={`${styles.avatarRingSmall} ${ringFilterClass}`} 
                              />
                              {isMatchedThisSlot && oppAvatar ? (
                                <img src={oppAvatar} alt={`Opponent ${idx + 1} Avatar`} className={styles.avatarImageSmall} />
                              ) : (
                                <div className={styles.scrollingAvatarsWrapperSmall}>
                                  <div 
                                    className={styles.scrollingAvatarsContainerSmall}
                                    style={{
                                      animationDelay: `${idx * 0.3}s`,
                                      animationDuration: `${4.5 + idx * 0.5}s`
                                    }}
                                  >
                                    {getShiftedAvatars(idx).map((url, i) => (
                                      <img key={i} src={url} className={styles.scrollingAvatarItemSmall} alt="Searching avatar" />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <span className={styles.playerNameYellow4}>{oppName}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* 2 Players Matchmaking Bottom Card */
                <div className={styles.profileContainerYellow}>
                  <img src={profileBgYellow} alt="Profile Background Yellow" className={styles.profileBgImage} />
                  <div className={styles.profileContentYellow}>
                    <div className={styles.avatarWrapper}>
                      {matchFound && (
                        <img src={profileOuterGlowYellow} className={styles.avatarGlowYellow} alt="Glow" />
                      )}
                      <div className={styles.avatarCircle}>
                        <img src={profileRoundYellow} alt="Round Ring Yellow" className={styles.avatarRing} />
                        {matchFound ? (
                          opponentAvatar ? (
                            <img src={opponentAvatar} alt="Opponent Avatar" className={styles.avatarImage} />
                          ) : (
                            <div className={styles.avatarPlaceholder} />
                          )
                        ) : (
                          <div className={styles.scrollingAvatarsWrapper}>
                            <div className={styles.scrollingAvatarsContainer}>
                              {[...lobbyAvatarsList, ...lobbyAvatarsList].map((url, i) => (
                                <img key={i} src={url} className={styles.scrollingAvatarItem} alt="Searching avatar" />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <span className={styles.playerNameYellow}>{opponentName}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Middle Section (Select Player Count) - Hidden when searching */}
        {!isSearching && (
          <div className={styles.middleSection}>
            {/* Divider */}
            <div className={styles.divider}>
              <span className={styles.diamond}></span>
              <span className={styles.dividerText}>SELECT PLAYER</span>
              <span className={styles.diamond}></span>
            </div>

            {/* Player Count Options */}
            <div className={styles.playerCountOptions}>
              <button
                className={`${styles.playerBtn} ${playerCount === 2 ? styles.active : ''}`}
                onClick={() => handleSelectMode(2)}
              >
                <div className={styles.playerBtnInner}>
                  <span className={styles.btnNumber}>2</span>
                  <span className={styles.btnText}>PLAYERS</span>
                </div>
              </button>

              <button
                className={`${styles.playerBtn} ${playerCount === 4 ? styles.active : ''}`}
                onClick={() => handleSelectMode(4)}
              >
                <div className={styles.playerBtnInner}>
                  <span className={styles.btnNumber}>4</span>
                  <span className={styles.btnText}>PLAYERS</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Temporary Quick Play Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            if (playerCount === null) {
              toast.info('Please select 2 Players or 4 Players first.');
              return;
            }
            const initData = playerCount === 2
              ? [
                { name: currentUser?.userName || 'Player 1', isBot: false, avatarUrl: currentUser?.avatar_url },
                { name: 'PLAYER', isBot: false, avatarUrl: lobbyAvatarsList[1] || '' },
              ]
              : [
                { name: currentUser?.userName || 'Player 1', isBot: false, avatarUrl: currentUser?.avatar_url },
                { name: 'PLAYER', isBot: false, avatarUrl: lobbyAvatarsList[1] || '' },
                { name: 'ZENO', isBot: false, avatarUrl: lobbyAvatarsList[2] || '' },
                { name: 'REX', isBot: false, avatarUrl: lobbyAvatarsList[3] || '' },
              ];
            navigate('/play', {
              state: { initData }
            });
          }}
          className={styles.tempQuickPlayBtn}
        >
          QUICK PLAY (TEMP MANUAL)
        </button>

        {/* Buttons (Play / Cancel) */}
        {!isSearching ? (
          <button
            className={styles.playButtonWrapper}
            onClick={handlePlayBtnClick}
            disabled={playerCount === null || isConnectingSocket}
          >
            <img src={playBtnImg} alt="Play" className={styles.playBtnImage} />
            <span className={styles.playText}>
              {isConnectingSocket ? 'CONNECTING...' : 'PLAY'}
            </span>
            <div className={styles.shiningEffect}></div>
          </button>
        ) : (
          !matchFound && (
            <button className={styles.cancelSearchBtn} onClick={handleCancelSearch}>
              CANCEL SEARCH
            </button>
          )
        )}

        {/* Countdown Overlay (Downside) */}
        {countdown !== null && (
          <div
            key={countdown.toString()}
            className={countdown === "Let's Play!" ? styles.letsPlayOverlay : styles.countdownOverlay}
          >
            {countdown}
          </div>
        )}
      </main>
      <ToastContainer position="bottom-center" theme="dark" />
    </div>
  );
}

export default PlayerSetup;

