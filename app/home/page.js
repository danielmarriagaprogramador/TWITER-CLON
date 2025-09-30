"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import { Home as HomeIcon, Search, Bell, Mail, SquarePen as PenSquare, X, Image as ImageIcon, Smile, Hash, Users, User, MoreHorizontal, Compass, Menu, ArrowLeft,Heart, Repeat2, MessageCircle } from "lucide-react";

export default function HomePage() {
  const { user, logout } = useAuth();
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]); 
  const [newPost, setNewPost] = useState("");
  const [file, setFile] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); 
  const [isExplore, setIsExplore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const textareaRef = useRef(null);

  // Estados responsive
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // --- Estados para follow / tabs ---
  const [activeTab, setActiveTab] = useState("forYou"); // "forYou" | "following"
  const [followingIds, setFollowingIds] = useState([]); // lista de IDs que el usuario sigue
  const [followersCount, setFollowersCount] = useState(0); // contador del perfil seleccionado
  const [isFollowingSelected, setIsFollowingSelected] = useState(false); // si el usuario actual sigue al seleccionado

  // --- Estados para Edit Profile ---
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editProfileData, setEditProfileData] = useState({
    name: "",
    bio: "",
    location: "",
    website: "",
    birthdate: "",
    avatar: "",
  });
  const [editAvatarFile, setEditAvatarFile] = useState(null);

  // Estado para almacenar datos del perfil actual del usuario
  const [currentUserProfile, setCurrentUserProfile] = useState(null);

  // Estados para likes
  const [postLikes, setPostLikes] = useState({}); // { post_id: { count: number, isLiked: boolean } }
  const [likingPosts, setLikingPosts] = useState(new Set()); // posts que están procesando like

  //  Estados para reposts
  const [postReposts, setPostReposts] = useState({}); // { post_id: { count: number, isReposted: boolean } }
  const [repostingPosts, setRepostingPosts] = useState(new Set()); // posts que están procesando repost

  // Estados para replies
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [replyingToPost, setReplyingToPost] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyFile, setReplyFile] = useState(null);
  const [postReplies, setPostReplies] = useState({}); // { post_id: count }

  // Si el contexto aún no tiene user, no renderiza (AuthContext maneja loading)
  if (!user) return null;

  // Hook para detectar tamaño de pantalla
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchPosts();
    fetchFollowing(); // carga a quién sigo
    fetchCurrentUserProfile(); //cargar perfil del usuario actual
  }, []);

  useEffect(() => {
    if (isModalOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isModalOpen]);

  // cuando cambias de selectedUser, actualiza followersCount y si lo sigues
  useEffect(() => {
    if (!selectedUser) {
      setFollowersCount(0);
      setIsFollowingSelected(false);
      return;
    }
    fetchFollowersCount(selectedUser.id);
    checkIfFollowingSelected(selectedUser.id);
 
  }, [selectedUser]);

  // función para obtener el perfil actualizado del usuario actual
  async function fetchCurrentUserProfile() {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.uid)
        .single();

      if (!error && data) {
        setCurrentUserProfile(data);
      } else {
        // Si no existe perfil, usar datos de Firebase Auth 
        const displayName = user.displayName || user.name || user.email || "Sin nombre";
        const photoURL = user.photoURL || `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(displayName)}`;
        
        setCurrentUserProfile({
          id: user.uid,
          name: displayName,
          avatar: photoURL,
          bio: "",
          location: "",
          website: "",
          birthdate: null,
        });
      }
    } catch (err) {
      console.error("fetchCurrentUserProfile error:", err);
      const displayName = user.displayName || user.name || user.email || "Sin nombre";
      const photoURL = user.photoURL || `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(displayName)}`;
      
      setCurrentUserProfile({
        id: user.uid,
        name: displayName,
        avatar: photoURL,
        bio: "",
        location: "",
        website: "",
        birthdate: null,
      });
    }
  }

  // Función para obtener likes de todos los posts
  async function fetchPostLikes(postIds) {
    if (!postIds || postIds.length === 0) return;

    try {
      // Obtener todos los likes de estos posts
      const { data: allLikes, error } = await supabase
        .from("likes")
        .select("post_id, user_id")
        .in("post_id", postIds);

      if (error) {
        console.error("Error fetching likes:", error);
        return;
      }

      // Procesar likes por post
      const likesData = {};
      postIds.forEach(postId => {
        const postLikesData = allLikes?.filter(like => like.post_id === postId) || [];
        likesData[postId] = {
          count: postLikesData.length,
          isLiked: postLikesData.some(like => like.user_id === user.uid)
        };
      });

      setPostLikes(likesData);
    } catch (err) {
      console.error("fetchPostLikes error:", err);
    }
  }

  // N Función para obtener reposts de todos los posts
  async function fetchPostReposts(postIds) {
    if (!postIds || postIds.length === 0) return;

    try {
      // Obtener todos los reposts de estos posts
      const { data: allReposts, error } = await supabase
        .from("reposts")
        .select("post_id, user_id")
        .in("post_id", postIds);

      if (error) {
        console.error("Error fetching reposts:", error);
        return;
      }

      // Procesar reposts por post
      const repostsData = {};
      postIds.forEach(postId => {
        const postRepostsData = allReposts?.filter(repost => repost.post_id === postId) || [];
        repostsData[postId] = {
          count: postRepostsData.length,
          isReposted: postRepostsData.some(repost => repost.user_id === user.uid)
        };
      });

      setPostReposts(repostsData);
    } catch (err) {
      console.error("fetchPostReposts error:", err);
    }
  }

  //  Función para obtener el conteo de replies
  async function fetchPostReplies(postIds) {
    if (!postIds || postIds.length === 0) return;

    try {
      const { data: allReplies, error } = await supabase
        .from("posts")
        .select("parent_post_id")
        .not("parent_post_id", "is", null)
        .in("parent_post_id", postIds);

      if (error) {
        console.error("Error fetching replies:", error);
        return;
      }

      // Contar replies por post
      const repliesData = {};
      postIds.forEach(postId => {
        const postRepliesData = allReplies?.filter(reply => reply.parent_post_id === postId) || [];
        repliesData[postId] = postRepliesData.length;
      });

      setPostReplies(repliesData);
    } catch (err) {
      console.error("fetchPostReplies error:", err);
    }
  }

  // Trae posts desde Supabase y reconstruye autores únicos
  async function fetchPosts() {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error al cargar posts:", error);
        setPosts([]);
        setUsers([]);
        return;
      }

      const postsData = data || [];
      setPosts(postsData);

      // Obtener likes, reposts y replies de todos los posts
      if (postsData.length > 0) {
        const postIds = postsData.map(post => post.id);
        await fetchPostLikes(postIds);
        await fetchPostReposts(postIds);
        await fetchPostReplies(postIds);
      }

      // Reconstruir lista de autores únicos desde posts
      const map = new Map();
      postsData.forEach((p) => {
        const id = p.author_id ?? p.authorId ?? p.author;
        const name = p.author_name ?? p.authorName ?? p.name ?? "Sin nombre";
        const avatar =
          p.author_avatar ??
          p.authorAvatar ??
          `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(name)}`;

        if (!id) return;
        if (!map.has(String(id))) {
          map.set(String(id), { id: String(id), name, avatar });
        }
      });
      setUsers(Array.from(map.values()));
    } catch (err) {
      console.error("fetchPosts error:", err);
      setPosts([]);
      setUsers([]);
    }
  }

  // Función para dar/quitar like
  async function handleLike(postId) {
    if (likingPosts.has(postId)) return; // Evitar múltiples clicks

    setLikingPosts(prev => new Set([...prev, postId]));

    try {
      const currentLike = postLikes[postId];
      const isLiked = currentLike?.isLiked || false;

      if (isLiked) {
        // Quitar like
        const { error } = await supabase
          .from("likes")
          .delete()
          .match({ post_id: postId, user_id: user.uid });

        if (error) {
          console.error("Error removing like:", error);
          return;
        }

        // Actualizar estado local
        setPostLikes(prev => ({
          ...prev,
          [postId]: {
            count: Math.max(0, (prev[postId]?.count || 1) - 1),
            isLiked: false
          }
        }));

      } else {
        // Dar like
        const { error } = await supabase
          .from("likes")
          .insert([{ post_id: postId, user_id: user.uid }]);

        if (error) {
          console.error("Error adding like:", error);
          return;
        }

        // Actualizar estado local
        setPostLikes(prev => ({
          ...prev,
          [postId]: {
            count: (prev[postId]?.count || 0) + 1,
            isLiked: true
          }
        }));
      }

    } catch (err) {
      console.error("handleLike error:", err);
    } finally {
      setLikingPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  }

  // Función para repost/unrepost
  async function handleRepost(postId) {
    if (repostingPosts.has(postId)) return; // Evitar múltiples clicks

    setRepostingPosts(prev => new Set([...prev, postId]));

    try {
      const currentRepost = postReposts[postId];
      const isReposted = currentRepost?.isReposted || false;

      if (isReposted) {
        // Quitar repost
        const { error } = await supabase
          .from("reposts")
          .delete()
          .match({ post_id: postId, user_id: user.uid });

        if (error) {
          console.error("Error removing repost:", error);
          return;
        }

        // Actualizar estado local
        setPostReposts(prev => ({
          ...prev,
          [postId]: {
            count: Math.max(0, (prev[postId]?.count || 1) - 1),
            isReposted: false
          }
        }));

      } else {
        // Hacer repost
        const { error } = await supabase
          .from("reposts")
          .insert([{ post_id: postId, user_id: user.uid }]);

        if (error) {
          console.error("Error adding repost:", error);
          return;
        }

        // Actualizar estado local
        setPostReposts(prev => ({
          ...prev,
          [postId]: {
            count: (prev[postId]?.count || 0) + 1,
            isReposted: true
          }
        }));
      }

    } catch (err) {
      console.error("handleRepost error:", err);
    } finally {
      setRepostingPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  }

  // Función para abrir modal de reply
  function openReplyModal(post) {
    setReplyingToPost(post);
    setReplyContent("");
    setReplyFile(null);
    setIsReplyModalOpen(true);
  }

  // Función para crear reply
  async function addReply(e) {
    e.preventDefault();
    
    if (!replyingToPost || !replyContent.trim()) return;

    try {
      let mediaUrl = null;
      if (replyFile) mediaUrl = await uploadFile(replyFile);

      const authorName = currentUserProfile?.name || user.displayName || user.name || user.email || "Sin nombre";
      const authorAvatar = currentUserProfile?.avatar || user.photoURL || `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(authorName)}`;

      const { error } = await supabase.from("posts").insert([
        {
          content: replyContent,
          media_url: mediaUrl,
          author_id: user.uid,
          author_name: authorName,
          author_avatar: authorAvatar,
          parent_post_id: replyingToPost.id, // Esto hace que sea un reply
        },
      ]);

      if (error) {
        console.error("Error al insertar reply:", error);
      } else {
        setReplyContent("");
        setReplyFile(null);
        setIsReplyModalOpen(false);
        setReplyingToPost(null);
        
        // Actualizar contador local de replies
        setPostReplies(prev => ({
          ...prev,
          [replyingToPost.id]: (prev[replyingToPost.id] || 0) + 1
        }));
        
        await fetchPosts(); // Recargar posts
      }
    } catch (err) {
      console.error("addReply error:", err);
    }
  }

  // Subir archivo a Supabase Storage y obtener URL pública
  async function uploadFile(f) {
    if (!f) return null;
    try {
      const fileName = `${Date.now()}-${f.name}`;
      const { error } = await supabase.storage.from("media").upload(fileName, f);
      if (error) {
        console.error("Error al subir archivo:", error);
        return null;
      }
      const { data } = supabase.storage.from("media").getPublicUrl(fileName);
      return data.publicUrl;
    } catch (err) {
      console.error("uploadFile error:", err);
      return null;
    }
  }

  //  Crear post usando datos actualizados del perfil
  async function addPost(e) {
    e.preventDefault();
    try {
      let mediaUrl = null;
      if (file) mediaUrl = await uploadFile(file);

      // Usar datos del perfil actualizado en lugar de Firebase Auth
      const authorName = currentUserProfile?.name || user.displayName || user.name || user.email || "Sin nombre";
      const authorAvatar = currentUserProfile?.avatar || user.photoURL || `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(authorName)}`;

      console.log("🚀 Creando post con datos actualizados:", {
        authorName,
        authorAvatar,
        currentUserProfile
      });

      const { error } = await supabase.from("posts").insert([
        {
          content: newPost,
          media_url: mediaUrl,
          author_id: user.uid,
          author_name: authorName,
          author_avatar: authorAvatar,
        },
      ]);

      if (error) {
        console.error("Error al insertar post:", error);
      } else {
        setNewPost("");
        setFile(null);
        setIsModalOpen(false);
        await fetchPosts(); // Recargar posts
      }
    } catch (err) {
      console.error("addPost error:", err);
    }
  }

  const displayName = currentUserProfile?.name || user.displayName || user.name || "Sin nombre";
  const emailOrPhone = user.email || user.contact || "";
  const photoURL = currentUserProfile?.avatar || user.photoURL || `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(displayName)}`;

  function closeModal() {
    setIsModalOpen(false);
    setNewPost("");
    setFile(null);
  }

  function closeReplyModal() {
    setIsReplyModalOpen(false);
    setReplyContent("");
    setReplyFile(null);
    setReplyingToPost(null);
  }

  // trae la lista de ids que el usuario actual sigue
  async function fetchFollowing() {
    try {
      const { data, error } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.uid);

      if (error) {
        console.error("Error cargando following:", error);
        setFollowingIds([]);
        return;
      }
      const ids = (data || []).map((r) => String(r.following_id));
      setFollowingIds(ids);
    } catch (err) {
      console.error("fetchFollowing error:", err);
      setFollowingIds([]);
    }
  }

  // cuenta followers de un usuario para mostrar en su perfil 
  async function fetchFollowersCount(userId) {
    try {
      const { data, count, error } = await supabase
        .from("follows")
        .select("*", { count: "exact" })
        .eq("following_id", userId);

      if (error) {
        console.error("Error al contar followers:", error);
        setFollowersCount(0);
        return;
      }
      setFollowersCount(count ?? (data ? data.length : 0));
    } catch (err) {
      console.error("fetchFollowersCount error:", err);
      setFollowersCount(0);
    }
  }

  // verifica si usuario actual sigue al seleccionado
  async function checkIfFollowingSelected(userId) {
    try {
      const { data, error } = await supabase
        .from("follows")
        .select("*")
        .eq("follower_id", user.uid)
        .eq("following_id", userId);

      if (error) {
        console.error("Error al chequear follow:", error);
        setIsFollowingSelected(false);
        return;
      }
      setIsFollowingSelected((data || []).length > 0);
    } catch (err) {
      console.error("checkIfFollowingSelected error:", err);
      setIsFollowingSelected(false);
    }
  }

  // follow a user seleccionado
  async function handleFollow(userId) {
    try {
      const { error } = await supabase.from("follows").insert([
        { follower_id: user.uid, following_id: userId },
      ]);
      if (error) {
        console.error("Error follow:", error);
        return;
      }
      setIsFollowingSelected(true);
      setFollowersCount((c) => c + 1);
      setFollowingIds((arr) => (arr.includes(String(userId)) ? arr : [...arr, String(userId)]));
    } catch (err) {
      console.error("handleFollow error:", err);
    }
  }

  // unfollow
  async function handleUnfollow(userId) {
    try {
      const { error } = await supabase
        .from("follows")
        .delete()
        .match({ follower_id: user.uid, following_id: userId });

      if (error) {
        console.error("Error unfollow:", error);
        return;
      }
      setIsFollowingSelected(false);
      setFollowersCount((c) => Math.max(0, c - 1));
      setFollowingIds((arr) => arr.filter((id) => id !== String(userId)));
    } catch (err) {
      console.error("handleUnfollow error:", err);
    }
  }

  // Abre modal de edición y carga datos existentes
  async function openEditProfile() {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.uid)
        .single();

      if (!error && data) {
        setEditProfileData({
          name: data.name ?? displayName,
          bio: data.bio ?? "",
          location: data.location ?? "",
          website: data.website ?? "",
          birthdate: data.birthdate ?? "",
          avatar: data.avatar ?? photoURL,
        });
      } else {
        setEditProfileData({
          name: displayName,
          bio: "",
          location: "",
          website: "",
          birthdate: "",
          avatar: photoURL,
        });
      }
    } catch (err) {
      console.error("openEditProfile error:", err);
      setEditProfileData({
        name: displayName,
        bio: "",
        location: "",
        website: "",
        birthdate: "",
        avatar: photoURL,
      });
    } finally {
      setEditAvatarFile(null);
      setIsEditProfileOpen(true);
    }
  }

  // Guarda cambios de perfil
  async function saveProfile(e) {
    e.preventDefault();
    try {
      let avatarUrl = editProfileData.avatar || null;
      if (editAvatarFile) {
        const uploaded = await uploadFile(editAvatarFile);
        if (uploaded) avatarUrl = uploaded;
      }

      const toUpsert = {
        id: user.uid,
        name: editProfileData.name,
        bio: editProfileData.bio,
        location: editProfileData.location,
        website: editProfileData.website,
        avatar: avatarUrl,
        birthdate: editProfileData.birthdate || null,
        updated_at: new Date().toISOString(),
      };

      console.log("➡️ Intentando guardar perfil:", toUpsert);

      const { data, error } = await supabase.from("profiles").upsert([toUpsert]);

      if (error) {
        console.error("❌ Error guardando profile:", error);
        return;
      }

      console.log("✅ Perfil guardado:", data);

      //  Actualizar el estado local del perfil del usuario actual
      setCurrentUserProfile(toUpsert);

      //  Actualizar posts existentes del usuario
      try {
        console.log("🔄 Actualizando posts existentes...");
        const { error: postUpdateError } = await supabase
          .from("posts")
          .update({
            author_name: toUpsert.name,
            author_avatar: toUpsert.avatar,
          })
          .eq("author_id", user.uid);

        if (postUpdateError) {
          console.error("Error actualizando posts con nuevo avatar/nombre:", postUpdateError);
        } else {
          console.log("✅ Posts actualizados correctamente");
        }
      } catch (err) {
        console.error("Error al actualizar posts:", err);
      }

      // Actualizar selectedUser si es el usuario actual
      if (selectedUser && String(selectedUser.id) === String(user.uid)) {
        setSelectedUser((su) => ({
          ...su,
          name: toUpsert.name,
          avatar: toUpsert.avatar,
          bio: toUpsert.bio,
          location: toUpsert.location,
          website: toUpsert.website,
          birthdate: toUpsert.birthdate,
        }));
      }

      //  Recargar posts para reflejar cambios inmediatamente
      await fetchPosts();

      // Cerrar modal
      setIsEditProfileOpen(false);
      setEditAvatarFile(null);

      console.log("🎉 Perfil actualizado completamente");
    } catch (err) {
      console.error("⚠️ saveProfile exception:", err);
    }
  }


  const q = (searchQuery || "").trim().toLowerCase();

  // Filtrado de posts y usuarios
  let filteredPosts = posts;
  let filteredUsers = users;

  // Si estamos en la pestaña Following -> filtrar posts solo de los que sigo
  if (activeTab === "following") {
    filteredPosts = posts.filter((p) => followingIds.includes(String(p.author_id)));
  }

  if (selectedUser) {
    // perfil abierto en el centro: posts del autor
    filteredPosts = posts.filter(
      (p) => String(p.author_id ?? p.authorId ?? p.author) === String(selectedUser.id)
    );
  } else {
    // Si hay búsqueda activa (o estamos en Explore), aplicamos filtros
    if (q.length > 0 || isExplore) {
      if (q.length > 0) {
        filteredPosts = filteredPosts.filter(
          (p) =>
            (p.content ?? "").toString().toLowerCase().includes(q) ||
            (p.author_name ?? "").toString().toLowerCase().includes(q)
        );
        filteredUsers = users.filter(
          (u) =>
            (u.name ?? "").toString().toLowerCase().includes(q) ||
            (u.id ?? "").toString().toLowerCase().includes(q)
        );
      } else {
        filteredUsers = users;
      }
    }
  }

  // abrir perfil desde feed o lista de users
  async function openProfileFromAuthor(authorId, authorName, authorAvatar) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", String(authorId))
        .single();

      if (!error && data) {
        setSelectedUser({
          id: String(authorId),
          name: data.name || authorName || "Sin nombre",
          avatar: data.avatar || authorAvatar,
          bio: data.bio || "",
          location: data.location || "",
          website: data.website || "",
          birthdate: data.birthdate || null,
        });
      } else {
        setSelectedUser({
          id: String(authorId),
          name: authorName || "Sin nombre",
          avatar: authorAvatar,
        });
      }
    } catch (err) {
      console.error("openProfileFromAuthor error:", err);
      setSelectedUser({
        id: String(authorId),
        name: authorName || "Sin nombre",
        avatar: authorAvatar,
      });
    }
    setIsExplore(false);
    setIsMobileMenuOpen(false);
  }

  // Función para resetear a home
  function goHome() {
    setSelectedUser(null);
    setIsExplore(false);
    setSearchQuery("");
    setActiveTab("forYou");
    setIsMobileMenuOpen(false);
    fetchPosts();
    fetchFollowing();
  }

  //  Helper para encontrar el post padre de un reply
  function findParentPost(parentId) {
    return posts.find(p => p.id === parentId);
  }

  // Componente de navegación para escritorio
  const DesktopSidebar = () => (
    <aside className="hidden lg:flex w-64 border-r border-gray-800 p-4 flex-col justify-between h-screen sticky top-0">
      <div>
        <img
          src="/twitter-x-logo-white (3).svg"
          alt="Logo X"
          className="w-8 mb-6 cursor-pointer"
          onClick={goHome}
        />

        <nav className="flex flex-col gap-2">
          <button
            className=" mama flex items-center gap-4 text-xl text-left hover:text-[#1d9bf0] px-4 py-2 rounded-full"
            onClick={goHome}
          >
            <HomeIcon className="w-6 h-6" /> Home
          </button>

          <button
            className={` mama flex items-center gap-4 text-xl text-left px-4 py-2 rounded-full ${
              isExplore ? "text-[#1d9bf0]" : "hover:text-[#1d9bf0]"
            }`}
            onClick={() => {
              setSelectedUser(null);
              setIsExplore(true);
            }}
          >
            <Search className="w-6 h-6" /> Explore
          </button>

          <button className=" mama flex items-center gap-4 text-xl text-left hover:text-[#1d9bf0] px-4 py-2 rounded-full">
            <Bell className="w-6 h-6" /> Notifications
          </button>

          <button className=" mama flex items-center gap-4 text-xl text-left hover:text-[#1d9bf0] px-4 py-2 rounded-full">
            <Mail className="w-6 h-6" /> Messages
          </button>

          <button className=" mama flex items-center gap-4 text-xl text-left hover:text-[#1d9bf0] px-4 py-2 rounded-full">
            <Compass className="w-6 h-6" /> Grok
          </button>

          <button className=" mama flex items-center gap-4 text-xl text-left hover:text-[#1d9bf0] px-4 py-2 rounded-full">
            <Users className="w-6 h-6" /> Communities
          </button>

          <button
            className=" mama flex items-center gap-4 text-xl text-left hover:text-[#1d9bf0] px-4 py-2 rounded-full w-full"
            onClick={async () => {
              try {
                const { data, error } = await supabase
                  .from("profiles")
                  .select("*")
                  .eq("id", user.uid)
                  .single();

                if (error) {
                  console.error("Error trayendo perfil:", error);
                  setSelectedUser({
                    id: user.uid,
                    name: displayName,
                    avatar: photoURL,
                  });
                } else {
                  setSelectedUser({
                    id: data.id,
                    name: data.name || displayName,
                    avatar: data.avatar || photoURL,
                    bio: data.bio || "",
                    location: data.location || "",
                    website: data.website || "",
                    birthdate: data.birthdate || null,
                  });
                }

                setIsExplore(false);
                setSearchQuery("");
                setActiveTab("forYou");
              } catch (err) {
                console.error(err);
              }
            }}
          >
            <User className="w-6 h-6" /> Profile
          </button>

          <button className=" mama flex items-center gap-4 text-xl text-left hover:text-[#1d9bf0] px-4 py-2 rounded-full">
            <MoreHorizontal className="w-6 h-6" /> More
          </button>
        </nav>

        <button
          className=" mama bg-white text-black w-full mt-6 py-3 rounded-full font-bold hover:bg-[#1a8cd8] flex items-center justify-center gap-2"
          onClick={() => setIsModalOpen(true)}
        >
          <PenSquare className="w-5 h-5" /> Post
        </button>
      </div>

      {/* Perfil abajo con menú */}
      <div className="relative">
        <div
          className="flex items-center gap-3 mt-6 p-3 rounded-full hover:bg-gray-900 transition cursor-pointer"
          onClick={() => setShowLogoutMenu((prev) => !prev)}
        >
          <img
            src={photoURL}
            alt="avatar"
            className="w-10 h-10 rounded-full"
          />
          <div className="flex-1 text-left">
            <p className="font-bold truncate">{displayName}</p>
            <p className="text-gray-400 text-sm truncate">
              @{(emailOrPhone || "").split("@")[0]}
            </p>
          </div>
          <MoreHorizontal className="w-5 h-5 text-gray-400" />
        </div>

        {showLogoutMenu && (
          <div className="absolute right-0 bottom-12 bg-gray-900 border border-gray-800 rounded-xl shadow-lg w-40 z-50">
            <button
              className=" mama w-full text-left px-4 py-2 hover:bg-gray-800 rounded-xl"
              onClick={logout}
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </aside>
  );

  // Componente de navegación móvil en la parte superior
  const MobileHeader = () => (
    <header className="lg:hidden sticky top-0 bg-black z-40 border-b border-gray-800 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {selectedUser ? (
            <button
              onClick={() => {
                setSelectedUser(null);
                setIsExplore(false);
                setSearchQuery("");
                setActiveTab("forYou");
              }}
              className="p-2 hover:bg-gray-900 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 hover:bg-gray-900 rounded-full"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}
          
          {!selectedUser && (
            <img
              src="/twitter-x-logo-white (3).svg"
              alt="Logo X"
              className="w-6 cursor-pointer"
              onClick={goHome}
            />
          )}
          
          {selectedUser && (
            <div>
              <h2 className="text-lg font-bold">{selectedUser.name}</h2>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!selectedUser && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-2 hover:bg-gray-900 rounded-full"
            >
              <PenSquare className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );

  // Componente de menú lateral móvil
  const MobileMenu = () => (
    <>
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="w-80 max-w-[80vw] h-full bg-black border-r border-gray-800 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-6">
                <img
                  src="/twitter-x-logo-white (3).svg"
                  alt="Logo X"
                  className="w-8"
                />
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 hover:bg-gray-900 rounded-full"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Perfil del usuario */}
              <div className="flex items-center gap-3 mb-6">
                <img
                  src={photoURL}
                  alt="avatar"
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="font-bold">{displayName}</p>
                  <p className="text-gray-400 text-sm">
                    @{(emailOrPhone || "").split("@")[0]}
                  </p>
                </div>
              </div>

              <nav className="flex flex-col gap-1">
                <button
                  className="flex items-center gap-4 text-xl text-left hover:bg-gray-900 px-4 py-3 rounded-xl"
                  onClick={goHome}
                >
                  <HomeIcon className="w-6 h-6" /> Home
                </button>

                <button
                  className={`flex items-center gap-4 text-xl text-left px-4 py-3 rounded-xl ${
                    isExplore ? "bg-gray-900" : "hover:bg-gray-900"
                  }`}
                  onClick={() => {
                    setSelectedUser(null);
                    setIsExplore(true);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <Search className="w-6 h-6" /> Explore
                </button>

                <button className="flex items-center gap-4 text-xl text-left hover:bg-gray-900 px-4 py-3 rounded-xl">
                  <Bell className="w-6 h-6" /> Notifications
                </button>

                <button className="flex items-center gap-4 text-xl text-left hover:bg-gray-900 px-4 py-3 rounded-xl">
                  <Mail className="w-6 h-6" /> Messages
                </button>

                <button className="flex items-center gap-4 text-xl text-left hover:bg-gray-900 px-4 py-3 rounded-xl">
                  <Compass className="w-6 h-6" /> Grok
                </button>

                <button className="flex items-center gap-4 text-xl text-left hover:bg-gray-900 px-4 py-3 rounded-xl">
                  <Users className="w-6 h-6" /> Communities
                </button>

                <button
                  className="flex items-center gap-4 text-xl text-left hover:bg-gray-900 px-4 py-3 rounded-xl"
                  onClick={async () => {
                    try {
                      const { data, error } = await supabase
                        .from("profiles")
                        .select("*")
                        .eq("id", user.uid)
                        .single();

                      if (error) {
                        setSelectedUser({
                          id: user.uid,
                          name: displayName,
                          avatar: photoURL,
                        });
                      } else {
                        setSelectedUser({
                          id: data.id,
                          name: data.name || displayName,
                          avatar: data.avatar || photoURL,
                          bio: data.bio || "",
                          location: data.location || "",
                          website: data.website || "",
                          birthdate: data.birthdate || null,
                        });
                      }

                      setIsExplore(false);
                      setSearchQuery("");
                      setActiveTab("forYou");
                      setIsMobileMenuOpen(false);
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                >
                  <User className="w-6 h-6" /> Profile
                </button>

                <button className="flex items-center gap-4 text-xl text-left hover:bg-gray-900 px-4 py-3 rounded-xl">
                  <MoreHorizontal className="w-6 h-6" /> More
                </button>

                <div className="border-t border-gray-800 mt-4 pt-4">
                  <button
                    className="flex items-center gap-4 text-xl text-left hover:bg-gray-900 px-4 py-3 rounded-xl w-full text-red-500"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      logout();
                    }}
                  >
                    Log out
                  </button>
                </div>
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="bg-black text-white min-h-screen">
      <MobileHeader />
      <MobileMenu />
      
      <div className="flex max-w-7xl mx-auto">
        <DesktopSidebar />

        {/* FEED CENTRAL */}
        <main className="flex-1 border-r border-gray-800 max-h-screen overflow-y-auto scrollbar-hide lg:border-r-gray-800">
          {/* Encabezado de perfil */}
          {selectedUser ? (
            <div className="border-b border-gray-800 p-4 sticky top-0 bg-black z-10 hidden lg:block">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setIsExplore(false);
                    setSearchQuery("");
                    setActiveTab("forYou");
                  }}
                  className="p-2 hover:bg-gray-900 rounded-full"
                >
                  ←
                </button>
                <h2 className="text-xl font-bold">{selectedUser.name}</h2>
              </div>
            </div>
          ) : (
            <div className="flex justify-around border-b border-gray-800 sticky top-0 bg-black z-10">
              <button
                className={` mama w-1/2 py-4 font-bold ${
                  activeTab === "forYou" ? "border-b-4 border-[#1d9bf0]" : ""
                }`}
                onClick={() => setActiveTab("forYou")}
              >
                For you
              </button>
              <button
                className={` mama w-1/2 py-4 text-gray-400 hover:text-white ${
                  activeTab === "following" ? "text-white" : ""
                }`}
                onClick={() => {
                  setActiveTab("following");
                  fetchFollowing();
                }}
              >
                Following
              </button>
            </div>
          )}

          {/* Perfil completo para móvil */}
          {selectedUser && (
            <div className="p-4 border-b border-gray-800 lg:hidden">
              <div className="flex flex-col gap-4">
                <img
                  src={
                    selectedUser.avatar ||
                    `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(
                      selectedUser.name || "U"
                    )}`
                  }
                  alt="avatar"
                  className="w-20 h-20 rounded-full"
                />
                <div>
                  <p className="text-lg font-bold">{selectedUser.name}</p>
                  <p className="text-gray-400">
                    @{String(selectedUser.id).slice(0, 20)}
                  </p>
                  {selectedUser.bio && (
                    <p className="text-white mt-2">{selectedUser.bio}</p>
                  )}

                  {selectedUser.location && (
                    <p className="text-gray-400 mt-1">{selectedUser.location}</p>
                  )}

                  {selectedUser.website && (
                    <a
                      href={selectedUser.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#1d9bf0] mt-1 block"
                    >
                      {selectedUser.website}
                    </a>
                  )}

                  {selectedUser.birthdate && (
                    <p className="text-gray-400 mt-1">
                      Nacido el{" "}
                      {(() => {
                        const d = new Date(selectedUser.birthdate);
                        return !isNaN(d.getTime())
                          ? d.toLocaleDateString()
                          : selectedUser.birthdate;
                      })()}
                    </p>
                  )}

                  <div className="mt-2 text-sm text-gray-400">
                    <span className="font-bold text-white mr-3">
                      {followersCount}
                    </span>
                    <span>Followers</span>
                  </div>

                  <div className="mt-3">
                    {String(selectedUser.id) === String(user.uid) ? (
                      <button
                        onClick={openEditProfile}
                        className="px-4 py-2 border rounded-full hover:bg-gray-900 text-sm"
                      >
                        Edit profile
                      </button>
                    ) : isFollowingSelected ? (
                      <button
                        onClick={() => handleUnfollow(selectedUser.id)}
                        className="px-4 py-2 bg-white text-black rounded-full hover:bg-gray-200 text-sm"
                      >
                        Unfollow
                      </button>
                    ) : (
                      <button
                        onClick={() => handleFollow(selectedUser.id)}
                        className="px-4 py-2 bg-white text-black rounded-full hover:bg-gray-200 text-sm"
                      >
                        Follow
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Perfil completo para desktop dentro del feed */}
          {selectedUser && (
            <div className="border-b border-gray-800 p-4 hidden lg:block">
              <div className="flex items-start gap-6">
                <img
                  src={
                    selectedUser.avatar ||
                    `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(
                      selectedUser.name || "U"
                    )}`
                  }
                  alt="avatar"
                  className="w-24 h-24 rounded-full"
                />
                <div>
                  <p className="text-lg font-bold">{selectedUser.name}</p>
                  <p className="text-gray-400">
                    @{String(selectedUser.id).slice(0, 20)}
                  </p>
                  {selectedUser.bio && (
                    <p className="text-white mt-2">{selectedUser.bio}</p>
                  )}

                  {selectedUser.location && (
                    <p className="text-gray-400">{selectedUser.location}</p>
                  )}

                  {selectedUser.website && (
                    <a
                      href={selectedUser.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#1d9bf0]"
                    >
                      {selectedUser.website}
                    </a>
                  )}

                  {selectedUser.birthdate && (
                    <p className="text-gray-400">
                      Nacido el{" "}
                      {(() => {
                        const d = new Date(selectedUser.birthdate);
                        return !isNaN(d.getTime())
                          ? d.toLocaleDateString()
                          : selectedUser.birthdate;
                      })()}
                    </p>
                  )}

                  <div className="mt-2 text-sm text-gray-400">
                    <span className="font-bold text-white mr-3">
                      {followersCount}
                    </span>
                    <span>Followers</span>
                  </div>

                  <div className="mt-3">
                    {String(selectedUser.id) === String(user.uid) ? (
                      <button
                        onClick={openEditProfile}
                        className=" mama px-4 py-1 border rounded-full hover:bg-gray-900"
                      >
                        Edit profile
                      </button>
                    ) : isFollowingSelected ? (
                      <button
                        onClick={() => handleUnfollow(selectedUser.id)}
                        className="px-4 py-1 bg-white text-black rounded-full hover:bg-gray-200"
                      >
                        Unfollow
                      </button>
                    ) : (
                      <button
                        onClick={() => handleFollow(selectedUser.id)}
                        className="px-4 py-1 bg-white text-black rounded-full hover:bg-gray-200"
                      >
                        Follow
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}


          {!selectedUser && (
            <form
              onSubmit={addPost}
              className="p-4 border-b border-gray-800 flex gap-3"
            >
              <img
                src={photoURL}
                alt="Foto de perfil"
                className="w-10 h-10 lg:w-12 lg:h-12 rounded-full"
              />
              <div className="flex-1">
                <textarea
                  placeholder="What's happening?"
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none text-lg resize-none"
                  rows={3}
                />
                <div className="flex items-center justify-between mt-3">
                  <div className="flex gap-4 text-[#1d9bf0]">
                    <label>
                      <ImageIcon className="w-5 h-5 cursor-pointer" />
                      <input
                        type="file"
                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                        className="hidden"
                      />
                    </label>
                    <Hash className="w-5 h-5 cursor-pointer" />
                    <Smile className="w-5 h-5 cursor-pointer" />
                  </div>
                  <button
                    type="submit"
                    className=" mama bg-[#1d9bf0] text-white font-bold py-2 px-4 rounded-full hover:bg-blue-500 transition text-sm lg:text-base"
                  >
                    Post
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Si Explore o hay búsqueda -> mostrar lista de usuarios  */}
          {(isExplore || q.length > 0) && (
            <div className="p-4 border-b border-gray-800">
              <h3 className="font-bold mb-2">Users</h3>
              {filteredUsers.length === 0 ? (
                <p className="text-gray-400 text-sm">No users found</p>
              ) : (
                filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 p-2 hover:bg-gray-900 rounded-lg cursor-pointer"
                    onClick={() => {
                      setSelectedUser(u);
                      setIsExplore(false);
                      setSearchQuery("");
                    }}
                  >
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-bold">{u.name}</p>
                      <p className="text-gray-400 text-sm">
                        {String(u.id).slice(0, 20)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Lista de posts */}
          <ul className="pb-20 lg:pb-0">
            {filteredPosts.map((post) => {
              const parentPost = post.parent_post_id ? findParentPost(post.parent_post_id) : null;
              
              return (
                <li
                  key={post.id}
                  className="p-4 border-b border-gray-800 hover:bg-gray-900 transition"
                >
                  {/*  Si es un reply, mostrar el post padre */}
                  {parentPost && (
                    <div className="mb-3 p-3 border border-gray-700 rounded-lg bg-gray-900/30">
                      <div className="flex gap-3 text-sm">
                        <img
                          src={
                            parentPost.author_avatar ??
                            `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(
                              parentPost.author_name ?? "U"
                            )}`
                          }
                          alt="avatar"
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="flex-1">
                          <p className="font-bold text-gray-300">{parentPost.author_name}</p>
                          <p className="text-gray-400 break-words">{parentPost.content}</p>
                          {parentPost.media_url && (
                            <div className="mt-2">
                              {parentPost.media_url.match(/\.(mp4|webm|ogg)$/i) ? (
                                <video
                                  src={parentPost.media_url}
                                  controls
                                  className="max-w-full rounded-md max-h-32"
                                />
                              ) : (
                                <img
                                  src={parentPost.media_url}
                                  alt="media"
                                  className="max-w-full rounded-md max-h-32"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <img
                      src={
                        post.author_avatar ??
                        `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(
                          post.author_name ?? "U"
                        )}`
                      }
                      alt="avatar"
                      className="w-10 h-10 rounded-full cursor-pointer"
                      onClick={() =>
                        openProfileFromAuthor(
                          post.author_id,
                          post.author_name,
                          post.author_avatar
                        )
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className="font-bold cursor-pointer hover:underline truncate"
                          onClick={() =>
                            openProfileFromAuthor(
                              post.author_id,
                              post.author_name,
                              post.author_avatar
                            )
                          }
                        >
                          {post.author_name}
                        </p>
                        {parentPost && (
                          <span className="text-gray-400 text-sm">
                            Replying to @{String(parentPost.author_id).slice(0, 10)}
                          </span>
                        )}
                      </div>
                      
                      <p className="mb-2 break-words">{post.content}</p>

                      {post.media_url &&
                        (post.media_url.match(/\.(mp4|webm|ogg)$/i) ? (
                          <video
                            src={post.media_url}
                            controls
                            className="max-w-full rounded-md"
                          />
                        ) : (
                          <img
                            src={post.media_url}
                            alt="media"
                            className="max-w-full rounded-md"
                          />
                        ))}
                        
                      {/* Botones de interacción */}
                      <div className="flex items-center gap-6 mt-3">
                        {/* Botón Reply */}
                        <button
                          onClick={() => openReplyModal(post)}
                          className=" mama flex items-center gap-1 text-sm hover:bg-blue-900/20 hover:text-blue-400 rounded-full px-2 py-1 transition group text-gray-500"
                        >
                          <MessageCircle className="w-5 h-5 group-hover:scale-110 transition" />
                          <span>{postReplies[post.id] || 0}</span>
                        </button>

                        {/* Botón Repost */}
                        <button
                          onClick={() => handleRepost(post.id)}
                          disabled={repostingPosts.has(post.id)}
                          className={` mama flex items-center gap-1 text-sm hover:bg-green-900/20 hover:text-green-400 rounded-full px-2 py-1 transition group ${
                            postReposts[post.id]?.isReposted 
                              ? 'text-green-400' 
                              : 'text-gray-500'
                          } ${
                            repostingPosts.has(post.id) ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <Repeat2 className="w-5 h-5 group-hover:scale-110 transition" />
                          <span>{postReposts[post.id]?.count || 0}</span>
                        </button>

                        {/* Botón Like */}
                        <button
                          onClick={() => handleLike(post.id)}
                          disabled={likingPosts.has(post.id)}
                          className={` mama flex items-center gap-1 text-sm hover:bg-red-900/20 hover:text-red-500 rounded-full px-2 py-1 transition group ${
                            postLikes[post.id]?.isLiked 
                              ? 'text-red-500' 
                              : 'text-gray-500'
                          } ${
                            likingPosts.has(post.id) ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <Heart 
                            className={`w-5 h-5 group-hover:scale-110 transition ${
                              postLikes[post.id]?.isLiked ? 'fill-current' : ''
                            }`}
                          />
                          <span>{postLikes[post.id]?.count || 0}</span>
                        </button>
                      </div>

                      <br />
                      <small className="text-gray-500">
                        {post.created_at
                          ? new Date(post.created_at).toLocaleString()
                          : ""}
                      </small>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </main>

        {/* COLUMNA DERECHA - Solo en desktop */}
        <aside className="w-80 p-4 hidden xl:flex flex-col gap-4">
          <div className="sticky top-0 bg-black pb-2 z-20">
            <div className="bg-gray-900 rounded-full px-4 py-2 flex items-center gap-2 border border-gray-800">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search X"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if ((e.target.value || "").trim().length > 0) {
                    setIsExplore(true);
                  }
                }}
                className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none text-lg"
              />
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-4">
            <h2 className="text-xl font-bold mb-2">Subscribe to Premium</h2>
            <p className="text-gray-400 text-sm mb-3">
              Subscribe to unlock new features and if eligible, receive a share
              of revenue.
            </p>
            <button className=" mama bg-[#1d9bf0] w-full py-2 rounded-full font-bold hover:bg-[#1a8cd8]">
              Subscribe
            </button>
          </div>

          <div className="bg-gray-900 rounded-xl p-4">
            <h2 className="text-xl font-bold mb-3">Today's News</h2>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>Daniel marriaga nuevo programador</li>
              <li>Daniel marriaga hizo un clon de Twitter</li>
              <li>Daniel marriaga lanza su propia app</li>
            </ul>
          </div>
        </aside>
      </div>

      {/* Botón flotante para crear post (solo móvil) */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="lg:hidden fixed bottom-20 right-4 bg-[#1d9bf0] p-4 rounded-full shadow-lg z-30"
      >
        <PenSquare className="w-6 h-6 text-white" />
      </button>

      {/* MODAL para crear post -  para móvil */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-black w-full max-w-lg rounded-xl border border-gray-800 p-4 lg:p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg lg:text-xl font-bold">Create Post</h2>
              <button onClick={closeModal}>
                <X className=" mama text-gray-400 hover:text-white" />
              </button>
            </div>

            <form onSubmit={addPost} className="flex flex-col gap-4">
              <div className="flex gap-3">
                <img
                  src={photoURL}
                  alt="avatar"
                  className="w-10 h-10 lg:w-12 lg:h-12 rounded-full"
                />
                <textarea
                  ref={textareaRef}
                  placeholder="What's happening?"
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none text-lg min-h-[100px] resize-none"
                />
              </div>

              {file && (
                <div className="relative">
                  {file.type && file.type.startsWith("video/") ? (
                    <video
                      src={URL.createObjectURL(file)}
                      controls
                      className="max-w-full rounded-md"
                    />
                  ) : (
                    <img
                      src={URL.createObjectURL(file)}
                      alt="preview"
                      className="max-w-full rounded-md"
                    />
                  )}
                  <button
                    type="button"
                    className="absolute top-2 right-2 bg-black/60 rounded-full p-1 hover:bg-black/80"
                    onClick={() => setFile(null)}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="flex gap-4 text-[#1d9bf0]">
                  <label>
                    <ImageIcon className="w-5 h-5 cursor-pointer" />
                    <input
                      type="file"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                      className="hidden"
                    />
                  </label>
                  <Hash className="w-5 h-5 cursor-pointer" />
                  <Smile className="w-5 h-5 cursor-pointer" />
                </div>

                <button
                  type="submit"
                  className=" mama bg-[#1d9bf0] text-white font-bold py-2 px-4 lg:px-6 rounded-full hover:bg-blue-500 transition text-sm lg:text-base"
                >
                  Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/*  MODAL para reply */}
      {isReplyModalOpen && replyingToPost && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={closeReplyModal}
        >
          <div
            className="bg-black w-full max-w-lg rounded-xl border border-gray-800 p-4 lg:p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg lg:text-xl font-bold">Reply to {replyingToPost.author_name}</h2>
              <button onClick={closeReplyModal}>
                <X className="text-gray-400 hover:text-white" />
              </button>
            </div>

            {/* Mostrar el post original */}
            <div className="mb-4 p-3 border border-gray-700 rounded-lg">
              <div className="flex gap-3">
                <img
                  src={
                    replyingToPost.author_avatar ??
                    `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(
                      replyingToPost.author_name ?? "U"
                    )}`
                  }
                  alt="avatar"
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <p className="font-bold">{replyingToPost.author_name}</p>
                  <p className="text-gray-300 break-words">{replyingToPost.content}</p>
                  {replyingToPost.media_url && (
                    <div className="mt-2">
                      {replyingToPost.media_url.match(/\.(mp4|webm|ogg)$/i) ? (
                        <video
                          src={replyingToPost.media_url}
                          controls
                          className="max-w-full rounded-md max-h-32"
                        />
                      ) : (
                        <img
                          src={replyingToPost.media_url}
                          alt="media"
                          className="max-w-full rounded-md max-h-32"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={addReply} className="flex flex-col gap-4">
              <div className="flex gap-3">
                <img
                  src={photoURL}
                  alt="avatar"
                  className="w-10 h-10 lg:w-12 lg:h-12 rounded-full"
                />
                <textarea
                  placeholder="Post your reply"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none text-lg min-h-[100px] resize-none"
                  autoFocus
                />
              </div>

              {replyFile && (
                <div className="relative">
                  {replyFile.type && replyFile.type.startsWith("video/") ? (
                    <video
                      src={URL.createObjectURL(replyFile)}
                      controls
                      className="max-w-full rounded-md"
                    />
                  ) : (
                    <img
                      src={URL.createObjectURL(replyFile)}
                      alt="preview"
                      className="max-w-full rounded-md"
                    />
                  )}
                  <button
                    type="button"
                    className="absolute top-2 right-2 bg-black/60 rounded-full p-1 hover:bg-black/80"
                    onClick={() => setReplyFile(null)}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="flex gap-4 text-[#1d9bf0]">
                  <label>
                    <ImageIcon className="w-5 h-5 cursor-pointer" />
                    <input
                      type="file"
                      onChange={(e) => setReplyFile(e.target.files?.[0] ?? null)}
                      className="hidden"
                    />
                  </label>
                  <Hash className="w-5 h-5 cursor-pointer" />
                  <Smile className="w-5 h-5 cursor-pointer" />
                </div>

                <button
                  type="submit"
                  disabled={!replyContent.trim()}
                  className=" mama bg-[#1d9bf0] text-white font-bold py-2 px-4 lg:px-6 rounded-full hover:bg-blue-500 transition text-sm lg:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                > 
                  Reply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/*  EDIT PROFILE -  para móvil */}
      {isEditProfileOpen && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setIsEditProfileOpen(false)}
        >
          <div
            className="bg-black w-full max-w-lg rounded-xl border border-gray-800 p-4 lg:p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg lg:text-xl font-bold">Edit profile</h2>
              <button onClick={() => setIsEditProfileOpen(false)}>
                <X className="text-gray-400 hover:text-white" />
              </button>
            </div>

            <form onSubmit={saveProfile} className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={editProfileData.avatar || photoURL}
                  alt="avatar"
                  className="w-16 h-16 rounded-full"
                />
                <label className="text-sm text-gray-400 cursor-pointer">
                  Change avatar
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) =>
                      setEditAvatarFile(e.target.files?.[0] ?? null)
                    }
                    className="hidden"
                  />
                </label>
              </div>

              <input
                type="text"
                placeholder="Name"
                value={editProfileData.name}
                onChange={(e) =>
                  setEditProfileData({
                    ...editProfileData,
                    name: e.target.value,
                  })
                }
                className="bg-transparent border border-gray-700 text-white p-3 rounded"
              />

              <textarea
                placeholder="Bio"
                value={editProfileData.bio}
                onChange={(e) =>
                  setEditProfileData({
                    ...editProfileData,
                    bio: e.target.value,
                  })
                }
                className="bg-transparent border border-gray-700 text-white p-3 rounded"
                rows={4}
              />

              <input
                type="text"
                placeholder="Location"
                value={editProfileData.location}
                onChange={(e) =>
                  setEditProfileData({
                    ...editProfileData,
                    location: e.target.value,
                  })
                }
                className="bg-transparent border border-gray-700 text-white p-3 rounded"
              />

              <input
                type="text"
                placeholder="Website"
                value={editProfileData.website}
                onChange={(e) =>
                  setEditProfileData({
                    ...editProfileData,
                    website: e.target.value,
                  })
                }
                className="bg-transparent border border-gray-700 text-white p-3 rounded"
              />

              <input
                type="date"
                value={editProfileData.birthdate || ""}
                onChange={(e) =>
                  setEditProfileData({
                    ...editProfileData,
                    birthdate: e.target.value,
                  })
                }
                className="bg-transparent border border-gray-700 text-white p-3 rounded"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-[#1d9bf0] text-white font-bold py-2 px-4 lg:px-6 rounded-full hover:bg-blue-500 transition text-sm lg:text-base"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

