import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCleanup } from '../../hooks/useCleanup';
import { authenticate } from '../../services/nakama';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from './IntroPage.module.css';

// Import assets from the project
import boardSvg from '../../assets/board.svg';
import tokenSvg from '../../assets/token.svg';
import logoImg from '../../Atlas_Lobby/images/logo.png';

import TokenIcon from '../../assets/token.svg?react';

const DieIcon = () => (
  <svg viewBox="0 0 100 100" width="100%" height="100%">
    <rect x="10" y="10" width="80" height="80" rx="15" fill="#f5f5f5" stroke="#ccc" strokeWidth="2" />
    <circle cx="30" cy="30" r="8" fill="#333" />
    <circle cx="70" cy="70" r="8" fill="#333" />
    <circle cx="30" cy="70" r="8" fill="#333" />
    <circle cx="70" cy="30" r="8" fill="#333" />
    <circle cx="50" cy="50" r="8" fill="#e53935" />
    <path d="M10 25 Q10 10 25 10 L75 10 Q90 10 90 25" fill="#fff" opacity="0.6" />
  </svg>
);

const BackgroundWatermarks = () => (
  <div className={styles.watermarksContainer}>
    <div className={styles.watermarkToken1}>
      <TokenIcon style={{ ['--fill-colour' as any]: '#ffffff' }} />
    </div>
    <div className={styles.watermarkToken2}>
      <TokenIcon style={{ ['--fill-colour' as any]: '#ffffff' }} />
    </div>
    <div className={styles.watermarkDie1}>
      <DieIcon />
    </div>
    <div className={styles.watermarkDie2}>
      <DieIcon />
    </div>
  </div>
);

const LOGIN_PROFILES = [
  {
    userId: "20001",
    userName: "NovaRush",
    email: "novarush@gmail.com",
    isbot: false,
    user_skill: "e",
    user_level: 1,
    avatar_url: "https://i.pravatar.cc/150?img=1",
    gamethumbnailurl: "",
    canPlay: true
  },
  {
    userId: "20002",
    userName: "ZyroMax",
    email: "zyromax@yahoo.com",
    isbot: false,
    user_skill: "e",
    user_level: 2,
    avatar_url: "https://i.pravatar.cc/150?img=2",
    gamethumbnailurl: "",
    canPlay: true
  },
  {
    userId: "20003",
    userName: "PixelJay",
    email: "pixeljay@outlook.com",
    isbot: false,
    user_skill: "e",
    user_level: 3,
    avatar_url: "https://i.pravatar.cc/150?img=3",
    gamethumbnailurl: "",
    canPlay: true
  },
  {
    userId: "20004",
    userName: "RexBlaze",
    email: "rexblaze@gmail.com",
    isbot: false,
    user_skill: "e",
    user_level: 4,
    avatar_url: "https://i.pravatar.cc/150?img=4",
    gamethumbnailurl: "",
    canPlay: true
  },
  {
    userId: "20005",
    userName: "TigoZen",
    email: "tigozen@yahoo.com",
    isbot: false,
    user_skill: "e",
    user_level: 5,
    avatar_url: "https://i.pravatar.cc/150?img=5",
    gamethumbnailurl: "",
    canPlay: true
  },
  {
    userId: "20006",
    userName: "LumaFox",
    email: "lumafox@hotmail.com",
    isbot: false,
    user_skill: "e",
    user_level: 6,
    avatar_url: "https://i.pravatar.cc/150?img=6",
    gamethumbnailurl: "",
    canPlay: true
  }
];

export default function IntroPage() {
  const cleanup = useCleanup();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [selectedProfileName, setSelectedProfileName] = useState('');

  useEffect(() => {
    document.title = 'LOOSER LUDO';
    cleanup();

    let isMounted = true;
    let chunkReady = false;
    
    const startTime = Date.now();
    const minDuration = 800; // slightly longer visual loading time for feel

    // PlayerSetup is now statically bundled, so we just wait for the visual timer
    chunkReady = true;

    // Smoothly animate the progress bar over minDuration
    const progressInterval = setInterval(() => {
      if (!isMounted) return;

      const elapsed = Date.now() - startTime;
      let calculatedProgress = (elapsed / minDuration) * 100;

      // If we haven't finished loading the chunk in the background, hold at 90%
      if (!chunkReady && calculatedProgress > 90) {
        calculatedProgress = 90 + Math.sin(elapsed / 500) * 2; // subtle pulse
      }

      if (calculatedProgress >= 100 && chunkReady) {
        setProgress(100);
        clearInterval(progressInterval);
      } else {
        setProgress(calculatedProgress);
      }
    }, 30);

    return () => {
      isMounted = false;
      clearInterval(progressInterval);
    };
  }, [cleanup]);

  const handleSelectProfile = async (profile: typeof LOGIN_PROFILES[0]) => {
    setIsLoggingIn(true);
    setSelectedProfileName(profile.userName);
    try {
      await authenticate(profile.userId, profile.userName);
      localStorage.setItem('ludo_user', JSON.stringify(profile));
      navigate('/setup');
    } catch (error) {
      console.error("Login failed:", error);
      toast.warn("Could not connect to online server. Playing offline.", { autoClose: 3000 });
      localStorage.setItem('ludo_user', JSON.stringify(profile));
      navigate('/setup');
    }
  };

  return (
    <div className={styles.introContainer}>
      <BackgroundWatermarks />
      
      {/* Logo Header */}
      <div className={styles.logoHeaderContainer}>
        <img src={logoImg} alt="Looser Ludo Logo" className={styles.logoImage} />
      </div>

      {/* Main Ludo Graphic Area */}
      {progress < 100 && (
        <div className={styles.graphicArea}>
          <div className={styles.boardWrapper}>
            <img src={boardSvg} alt="Ludo Board" className={styles.boardImg} />
            
            {/* Animated Tokens hopping on the board */}
            <img src={tokenSvg} alt="Green Token" className={`${styles.token} ${styles.tokenGreen}`} />
            <img src={tokenSvg} alt="Blue Token" className={`${styles.token} ${styles.tokenBlue}`} />
            <img src={tokenSvg} alt="Red Token" className={`${styles.token} ${styles.tokenRed}`} />
            <img src={tokenSvg} alt="Yellow Token" className={`${styles.token} ${styles.tokenYellow}`} />
          </div>
        </div>
      )}

      {/* Loading Option with Progress Bar or profile selector */}
      {progress < 100 ? (
        <div className={styles.loadingSection}>
          <div className={styles.progressBarWrapper}>
            <div 
              className={styles.progressBarFill} 
              style={{ width: `${progress}%` }} 
            />
          </div>
          <p className={styles.progressText}>LOADING... {Math.round(progress)}%</p>
        </div>
      ) : (
        <div className={styles.loginSectionContainer}>
          {isLoggingIn ? (
            <div className={styles.loggingInLoader}>
              <div className={styles.spinnerRing} />
              <p className={styles.loggingInText}>LOGGING IN AS {selectedProfileName.toUpperCase()}...</p>
            </div>
          ) : (
            <>
              <h2 className={styles.selectTitle}>SELECT PROFILE</h2>
              <div className={styles.profilesGrid}>
                {LOGIN_PROFILES.map((profile) => (
                  <button
                    key={profile.userId}
                    className={styles.profileCard}
                    onClick={() => handleSelectProfile(profile)}
                  >
                    <img src={profile.avatar_url} alt={profile.userName} className={styles.profileAvatar} />
                    <div className={styles.profileDetails}>
                      <span className={styles.profileName}>{profile.userName}</span>
                      <span className={styles.profileEmail}>{profile.email}</span>
                    </div>
                    <div className={styles.profileMeta}>
                      <span className={styles.profileLevel}>Lvl {profile.user_level}</span>
                      <span className={styles.profileSkill}>Skill: {profile.user_skill.toUpperCase()}</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      <ToastContainer position="bottom-center" theme="dark" />
    </div>
  );
}
