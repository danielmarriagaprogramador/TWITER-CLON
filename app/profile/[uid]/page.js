
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import Image from "next/image";

export default function ProfilePage() {
  const { uid } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    if (!uid) return;
    fetchProfile(uid);
    fetchPosts(uid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  async function fetchProfile(uid) {
    setLoadingProfile(true);
    console.log("[Profile] buscando profile para uid:", uid);

    if (user && user.uid === uid) {
      setProfile({
        displayName: user.displayName || user.email?.split("@")[0] || "Sin nombre",
        email: user.email || null,
        photoURL:
          user.photoURL ||
          `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(
            user.displayName || user.email || "U"
          )}`,
        _source: "auth",
      });
      setLoadingProfile(false);
      return;
    }

    try {
      const docRef = doc(db, "users", uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        console.log("[Profile] encontrado doc users/{uid}");
        setProfile({ ...snap.data(), _source: "firestore-doc" });
        setLoadingProfile(false);
        return;
      }
    } catch (e) {
      console.error("[Profile] error leyendo doc users/{uid}:", e);
    }

    try {
      const usersCol = collection(db, "users");
      const q = query(usersCol, where("uid", "==", uid));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        console.log("[Profile] encontrado por field uid (docs con id random)");
        setProfile({ ...qSnap.docs[0].data(), _source: "firestore-query-uid" });
        setLoadingProfile(false);
        return;
      }
    } catch (e) {
      console.error("[Profile] error query where uid==:", e);
    }

    const possibleFields = ["id", "userId", "user_id", "authUid"];
    for (const f of possibleFields) {
      try {
        const q = query(collection(db, "users"), where(f, "==", uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          console.log(`[Profile] encontrado por field ${f}`);
          setProfile({ ...snap.docs[0].data(), _source: `firestore-query-${f}` });
          setLoadingProfile(false);
          return;
        }
      } catch (e) {
        console.error(`[Profile] error query where ${f}==:`, e);
      }
    }

    try {
      const { data, error } = await supabase
        .from("posts")
        .select("author_name,author_avatar")
        .eq("author_id", uid)
        .limit(1);
      if (!error && data && data.length > 0) {
        console.log("[Profile] reconstruyendo perfil desde posts en supabase");
        setProfile({
          displayName: data[0].author_name || "Sin nombre",
          photoURL: data[0].author_avatar || null,
          _source: "supabase-post",
        });
        setLoadingProfile(false);
        return;
      }
    } catch (e) {
      console.error("[Profile] fallback supabase error:", e);
    }

    console.warn("[Profile] NO se encontró perfil para uid:", uid);
    setProfile(null);
    setLoadingProfile(false);
  }

  async function fetchPosts(uid) {
    setLoadingPosts(true);
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("author_id", uid)
        .order("created_at", { ascending: false });
      if (!error) setPosts(data || []);
      else console.error("Error al cargar posts:", error);
    } catch (err) {
      console.error("fetchPosts error:", err);
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  }

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        Cargando perfil...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        Perfil no encontrado.
        <div className="text-sm text-gray-400 mt-2">
          Nota: si ese usuario inició sesión antes de que activaras el guardado en Firestore,
          su documento puede faltar. Recomendado: migrar usuarios (ver consola).
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="max-w-2xl mx-auto p-4">
        <div className="flex items-center gap-4 border-b border-gray-800 pb-4 mb-6">
          <Image
            src={
              profile.photoURL ||
              `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(
                profile.displayName || "U"
              )}`
            }
            alt="avatar"
            width={80}
            height={80}
            className="w-20 h-20 rounded-full object-cover"
            priority
          />
          <div>
            <h1 className="text-2xl font-bold">{profile.displayName || profile.name}</h1>
            <p className="text-gray-400">@{profile.email?.split("@")[0]}</p>
            <p className="text-xs text-gray-500">Fuente: {profile._source || "unknown"}</p>
          </div>
        </div>

        <h2 className="text-xl font-bold mb-4">Posts</h2>
        {loadingPosts ? (
          <p className="text-gray-400">Cargando posts...</p>
        ) : posts.length === 0 ? (
          <p className="text-gray-500">Este usuario no tiene posts aún.</p>
        ) : (
          <ul>
            {posts.map((post) => (
              <li key={post.id} className="p-4 border-b border-gray-800 hover:bg-gray-900 transition">
                <p className="mb-2">{post.content}</p>
                {post.media_url &&
                  (post.media_url.match(/\.(mp4|webm|ogg)$/) ? (
                    <video src={post.media_url} controls className="max-w-xs rounded-md" />
                  ) : (
                    <Image
                      src={post.media_url}
                      alt="media"
                      width={400}
                      height={300}
                      className="max-w-xs rounded-md object-cover"
                    />
                  ))}
                <br />
                <small className="text-gray-500">{new Date(post.created_at).toLocaleString()}</small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

