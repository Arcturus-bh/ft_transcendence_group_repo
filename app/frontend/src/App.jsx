import React, { useEffect, useMemo, useRef, useState } from "react";

const LOGIN_KEY = "auth_login";
const AUTH_KEY = "auth_token";

/* ================================================================================= */
/* ================================================================================= */
/* =================================== AUTH ======================================== */
/* ================================================================================= */
/* ================================================================================= */
function useAuth() {
  
  const [isAuthed, setIsAuthed] = useState(false);
  const [login, setLogin] = useState("");

  useEffect(() => {
    const token = localStorage.getItem(AUTH_KEY);
    const storedLogin = localStorage.getItem(LOGIN_KEY);
    if (token) {
      setIsAuthed(true);
      setLogin(storedLogin || "player");
    }
  }, []);

  const signIn = (loginValue, token) => {
    localStorage.setItem(AUTH_KEY, token);
    localStorage.setItem(LOGIN_KEY, loginValue);
    setIsAuthed(true);
    setLogin(loginValue);
  };


  const signOut = () => {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(LOGIN_KEY);
    setIsAuthed(false);
    setLogin("");
  };

  return { isAuthed, login, signIn, signOut };
}
/* ================================================================================= */
/* ================================================================================= */
/* ====================================== APP ====================================== */
/* ================================================================================= */
/* ================================================================================= */
export default function App() {
  const { isAuthed, login, signIn, signOut } = useAuth();
  
  const [page, setPage] = useState("home");
  const [showChat, setShowChat] = useState(false);
  
  const [loginInput, setLoginInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  
  
  const [authMode, setAuthMode] = useState(null);
  
  const bgSrc = useMemo(() => "/images/enter.jpg", []);
  
  const [privacy, setPrivacy] = useState("privacy");
  const [terms, setTerms] = useState("terms");
  
  const [avatar, setAvatar] = useState(null);
  
  const handleSubmitLogin = async (e) => {
  e.preventDefault();

  try {
    const res = await fetch("http://localhost:3000/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: emailInput,
        password: passwordInput,
      }),
    });

    let data = {};
    if (res.headers.get("content-type")?.includes("application/json")) {
      data = await res.json();
    }

    if (!res.ok) {
      alert(data.error || "Erreur de connexion");
      return;
    }

    signIn(data.nickname, data.token);
    setAuthMode(null);
    setPage("dashboard");

  } catch (err) {
    alert("Impossible de contacter le serveur");
  }
  };

  const handleSubmitSub = async (e) => {
  e.preventDefault();

  try {
    const res = await fetch("http://localhost:3000/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: emailInput,
        nickname: loginInput,
        password: passwordInput,
      }),
    });
    
    let data = {};
    if (res.headers.get("content-type")?.includes("application/json")) {
      data = await res.json();
    }
    
    if (!res.ok) {
      alert(data.error || "Erreur d'inscription");
      return;
    }
    
    alert("Compte créé, vous pouvez vous connecter");
    setLoginInput("");
    setEmailInput("");
    setPasswordInput("");
    setAuthMode("login");

    } catch (err) {
      alert("Impossible de contacter le serveur");
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      localStorage.setItem("avatar", reader.result);
      setAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (isAuthed) setPage("dashboard");

    const saved = localStorage.getItem("avatar");
    if (saved) setAvatar(saved);
  }, [isAuthed]);
/* ================================================================================= */
/* ================================================================================= */
/* ===================================== CANVAS ==================================== */
/* ================================================================================= */
/* ================================================================================= */
function GameCanvas() {
  // Référence vers l’élément <canvas> du DOM
  const canvasRef = useRef(null);
  useEffect(() => {
    // Récupère le canvas réel depuis la ref
    const canvas = canvasRef.current;
    // Contexte 2D pour dessiner
    const ctx = canvas.getContext("2d");
    // Fonction qui ajuste la résolution du canvas à la taille écran
    const resize = () => {
      // Densité de pixels de l’écran (utile pour Retina)
      const dpr = window.devicePixelRatio || 1;
      // Taille du canvas telle qu’affichée en CSS
      const rect = canvas.getBoundingClientRect();
      // Résolution interne du canvas (évite le flou)
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      // Recalibre le contexte pour dessiner en coordonnées CSS normales
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    // Ajuste le canvas au chargement
    resize();
    // Réajuste le canvas si la fenêtre est redimensionnée
    window.addEventListener("resize", resize);
    // Variable temps utilisée pour l’animation
    let t = 0;
    // Boucle d’animation appelée à chaque frame
    const loop = () => {
      // Incrémente le temps
      t += 1;
      // Efface complètement le canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Dimensions visibles du canvas (CSS)
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      // Dessine un fond sombre
      ctx.fillStyle = "rgba(18, 216, 0, 1)";
      ctx.fillRect(0, 0, w, h);
    };
    // Lance la boucle d’animation
    loop();
    // Nettoyage : enlève le listener au démontage du composant
    return () => window.removeEventListener("resize", resize);
  }, []);
  // Rendu du canvas avec styles Tailwind
  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full neon-border rounded-xl"
    />
  );
}

/*-------------------------------------------------------------------------------------------------
---------------------------------------------------------------------------------------------------
---------------------------------------------------------------------------------------------------
------------------------------------          HOME PAGE          ----------------------------------
---------------------------------------------------------------------------------------------------
---------------------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------------------*/
	return (
		<div id="app" className="w-screen h-screen overflow-hidden">
      
      <footer className="absolute top-[880px] left-1/2 -translate-x-1/2 text-xs text-cyan-300 neon-glitch">
        <button onClick={() => setPage("privacy")}>Privacy Policy</button>
        {" | "}
        <button onClick={() => setPage("terms")}>Terms of Service</button>
      </footer>


      <img
        src={bgSrc}
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
        alt=""
      />

        {isAuthed && (
          <button
            className="neon-glitch absolute text-2xl px-1 py-1 top-5 left-5 z-[9999] bg-transparent neon-border"
            data-text="|||"
            onClick={() => setShowChat(v => !v)}
          >
            |||
          </button>
        )}
        {showChat && (
          <div className="absolute top-0 right-0 w-[400px] h-full bg-black/60 neon-border p-6 flex flex-col">
            <div className="flex-1" />
            <input className="px-3 py-2 rounded bg-gray-900/80 neon-border text-white" />
          </div>
        )}
        {page === "home" && (
          <div className="w-full h-full flex flex-col items-center">
            <div className="mt-[5vh]">
              <h1 className="neon-glitch absolute left-1/2 -translate-x-1/2 bg-transparent border-0 text-7xl" 
                  data-text="𝕋ℝ𝔸ℕ𝕊ℂ𝔼ℕ𝔻𝔸ℕℂ𝔼">
                𝕋ℝ𝔸ℕ𝕊ℂ𝔼ℕ𝔻𝔸ℕℂ𝔼
              </h1>
            </div>
            <div className="mt-[12vh] flex justify-center w-full">
              <button
                className="neon-glitch relative inline-block text-4xl bg-transparent border-0"
                data-text="ℂ𝕆ℕℕ𝔼ℂ𝕋𝕀𝕆ℕ⮩"
                onClick={() => setAuthMode("login")}
              >
                ℂ𝕆ℕℕ𝔼ℂ𝕋𝕀𝕆ℕ⮩
              </button>
            </div>
            <div className="mt-[1vh] flex justify-center w-full">
              <button
                className="neon-glitch relative inline-block text-4xl bg-transparent border-0"
                data-text="𝕊𝕌𝔹𝕊ℂℝ𝕀𝔹𝔼+"
                onClick={() => setAuthMode("register")}
              >
                𝕊𝕌𝔹𝕊ℂℝ𝕀𝔹𝔼+
              </button>
            </div>
  {/*------------------------------------------------------------------------------------------------
  ---------------------------------------------------------------------------------------------------
  ---------------------------------------------------------------------------------------------------
  --------------------------------------           LOG          -------------------------------------
  ---------------------------------------------------------------------------------------------------
  ---------------------------------------------------------------------------------------------------
  -------------------------------------------------------------------------------------------------*/}
            {authMode === "login" && (
              <div className="mt-[2vh] bg-black/60 p-6 rounded-xl backdrop-blur-xl neon-border">
                <form className="flex flex-col gap-4" onSubmit={handleSubmitLogin}>
                  <h1 className="neon-glitch absolute left-[40px] px-0 py-0 text-xl text-cyan-300" data-text="𝕎𝔼𝕃ℂ𝕆𝕄𝔼 𝔹𝔸ℂ𝕂!">
                    𝕎𝔼𝕃ℂ𝕆𝕄𝔼 𝔹𝔸ℂ𝕂!
                  </h1>
                  <input
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    placeholder="𝔼𝕄𝔸𝕀𝕃"
                    type="email"
                    className="px-3 py-2 rounded bg-gray-900/80 neon-border text-cyan-300"
                  />
                  <input
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    type="password"
                    placeholder="ℙ𝔸𝕊𝕊𝕎𝕆ℝ𝔻"
                    className="px-3 py-2 rounded bg-gray-900/80 neon-border text-cyan-300"
                    autoComplete="current-password"
                  />
                  <button type="submit" className="neon-glitch px-4 py-2 bg-gray-900/80 text-cyan-300 rounded neon-border">
                    👾 𝔾𝕆 👾
                  </button>
                </form>
              </div>
            )}
  {/*------------------------------------------------------------------------------------------------
  ---------------------------------------------------------------------------------------------------
  ---------------------------------------------------------------------------------------------------
  ---------------------------------           REGISTER          -------------------------------------
  ---------------------------------------------------------------------------------------------------
  ---------------------------------------------------------------------------------------------------
  -------------------------------------------------------------------------------------------------*/}
            {authMode === "register" && (
              <div className="mt-[2vh] bg-black/60 p-6 rounded-xl backdrop-blur-xl neon-border">
                <form className="flex flex-col gap-4" onSubmit={handleSubmitSub}>
                  <h1 className="neon-glitch absolute left-[70px] px-0 py-0 text-xl text-cyan-300" data-text="𝕎𝔼𝕃ℂ𝕆𝕄𝔼 !">
                    𝕎𝔼𝕃ℂ𝕆𝕄𝔼 !
                  </h1>
                  <input
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    placeholder="𝕃𝕆𝔾𝕀ℕ"
                    className="px-3 py-2 rounded bg-gray-900/80 neon-border text-cyan-300"
                  />
                  <input
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="𝔼𝕄𝔸𝕀𝕃"
                    type="email"
                    className="px-3 py-2 rounded bg-gray-900/80 neon-border text-cyan-300"
                  />
                  <input
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    type="password"
                    placeholder="ℙ𝔸𝕊𝕊𝕎𝕆ℝ𝔻"
                    className="px-3 py-2 rounded bg-gray-900/80 neon-border text-cyan-300"
                  />
                  <button type="submit" className="neon-glitch px-4 py-2 bg-gray-900/80 text-cyan-300 rounded neon-border">
                    👾 𝔾𝕆 👾
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
  {/*------------------------------------------------------------------------------------------------
  ---------------------------------------------------------------------------------------------------
  ---------------------------------------------------------------------------------------------------
  ------------------------------------          MAIN MENU          ----------------------------------
  ---------------------------------------------------------------------------------------------------
  ---------------------------------------------------------------------------------------------------
  -------------------------------------------------------------------------------------------------*/}
        {page === "dashboard" && (
          <div className="w-full h-full flex flex-col items-center">

            <div className="mt-[5vh]">
              <h1 className="neon-glitch absolute left-1/2 -translate-x-1/2 bg-transparent border-0 text-7xl" 
                  data-text="𝕋ℝ𝔸ℕ𝕊ℂ𝔼ℕ𝔻𝔸ℕℂ𝔼"
                >
                𝕋ℝ𝔸ℕ𝕊ℂ𝔼ℕ𝔻𝔸ℕℂ𝔼
              </h1>
            </div>

            <div className="text-3xl mt-[9vh] text-white">
              <span className="text-cyan-300">{login}</span>
            </div>

            <div className="mt-[2vh] text-white">
              <button
                className="neon-glitch ml-4 px-3 py-0 neon-border bg-gray-0/0"
                onClick={() => {
                  signOut();
                  setPage("home");
                }}
                data-text="𝕃𝕠𝕘𝕠𝕦𝕥">
                𝕃𝕠𝕘𝕠𝕦𝕥
              </button>
            </div>

            <div className="mt-[7vh] flex flex-col gap-6 items-center">
              <button className="neon-glitch text-5xl bg-transparent border-0" 
                data-text="ℙ𝕃𝔸𝕐"
                onClick={() => setPage("game")}>
                ℙ𝕃𝔸𝕐
              </button>
              <button className="neon-glitch text-5xl bg-transparent border-0"
                data-text="ℙℝ𝕆𝔽𝕀𝕃𝔼"
                onClick={() => setPage("profile")}>
                ℙℝ𝕆𝔽𝕀𝕃𝔼
              </button>
              <button className="neon-glitch text-5xl bg-transparent border-0"
                data-text="𝕆ℙ𝕋𝕀𝕆ℕ𝕊">
                𝕆ℙ𝕋𝕀𝕆ℕ𝕊
              </button>
            </div>
          </div>
        )}
  {/*------------------------------------------------------------------------------------------------
  ---------------------------------------------------------------------------------------------------
  ---------------------------------------------------------------------------------------------------
  ----------------------------------           GAMES CANVAS          --------------------------------
  ---------------------------------------------------------------------------------------------------
  ---------------------------------------------------------------------------------------------------
  -------------------------------------------------------------------------------------------------*/}
        {page === "game" && (
          <div className="w-full h-full relative">
            <button
              className="absolute top-4 left-4 px-4 py-2 neon-border bg-gray-900/60 text-white"
              onClick={() => setPage("dashboard")}
            >
              𝔹𝕒𝕔𝕜
            </button>

            <div className="absolute inset-x-0 top-[10%] mx-auto w-[90vw] h-[80vh]">
              <GameCanvas />
            </div>
          </div>
        )}
  {/*------------------------------------------------------------------------------------------------
  ---------------------------------------------------------------------------------------------------
  ---------------------------------------------------------------------------------------------------
  ----------------------------------           PROFILE PAGE          --------------------------------
  ---------------------------------------------------------------------------------------------------
  ---------------------------------------------------------------------------------------------------
  -------------------------------------------------------------------------------------------------*/}
        {page === "profile" && (
          <div className="w-full h-full relative overflow-hidden">
            <div className="mt-[1vh] w-full h-full flex flex-col items-center">
              <h1 className="neon-glitch relative inline-block text-7xl"
                  data-text="ℙℝ𝕆𝔽𝕀𝕃𝔼">
                ℙℝ𝕆𝔽𝕀𝕃𝔼
              </h1>
              <button
                className="neon-glitch absolute text-2xl top-[50px] px-3 py-0 neon-border bg-gray-900/60"
                onClick={() => setPage("dashboard")}
                data-text="𝔹𝕒𝕔𝕜">
                𝔹𝕒𝕔𝕜
              </button>

              <label
                className="
                  absolute
                  top-[230px]
                  text-xs
                  cursor-pointer
                  neon-border
                  neon-glitch
                  px-2
                  py-1
                  font-mono
                  text-cyan-300
                  hover:underline
                "
              >
                change avatar
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>

              <img
                src={avatar || "/images/default-avatar.png"}
                className="w-32 h-32 absolute top-[200px] rounded-full object-cover neon-border"
              />

              <h1 className="neon-glitch absolute text-2xl top-[290px]"
                    data-text="Login">
                    Login
              </h1>

              <h1 className="neon-glitch absolute font-bold font-mono text-3xl top-[300px]">
                <span className="text-cyan-300">{login}</span>
              </h1>
            </div>


          </div>
        )}
  {/*------------------------------------------------------------------------------------------------
  ---------------------------------------------------------------------------------------------------
  ---------------------------------------------------------------------------------------------------
  --------------------------------           PRIVACY POLICY          --------------------------------
  ---------------------------------------------------------------------------------------------------
  ---------------------------------------------------------------------------------------------------
  -------------------------------------------------------------------------------------------------*/}
        {page === "privacy" && (
          <div className="w-full h-full flex flex-col items-center justify-center bg-black/80 p-8 text-cyan-300">
            <h1 className="text-3xl mb-4 neon-glitch">Privacy Policy</h1>
            <p className="max-w-3xl text-sm leading-relaxed">
              This application is a student project developed as part of the 42 curriculum.
              <br /><br />
              We collect user data such as username, encrypted password, avatar, and game-related
              information in order to provide authentication and gameplay features.
              <br /><br />
              Data is stored securely and never shared with third parties.
            </p>
            <button className="mt-6 neon-border px-4 py-1" onClick={() => setPage("home")}>
              Back
            </button>
          </div>
        )}
  {/*------------------------------------------------------------------------------------------------
  ---------------------------------------------------------------------------------------------------
  ---------------------------------------------------------------------------------------------------
  --------------------------------           TERMS OF SERVICE          ------------------------------
  ---------------------------------------------------------------------------------------------------
  ---------------------------------------------------------------------------------------------------
  -------------------------------------------------------------------------------------------------*/}
        {page === "terms" && (
          <div className="w-full h-full flex flex-col items-center justify-center bg-black/80 p-8 text-cyan-300">
            <h1 className="text-3xl mb-4 neon-glitch">Terms of Service</h1>
            <p className="max-w-3xl text-sm leading-relaxed">
              This application is part of an educational project within the 42 curriculum.
              <br /><br />
              Users must not abuse the platform, cheat, or disrupt the service.
              <br /><br />
              The service is provided as is, without guarantees.
            </p>
            <button className="mt-6 neon-border px-4 py-1" onClick={() => setPage("home")}>
              Back
            </button>
          </div>
        )}

      </div>
    );
}
