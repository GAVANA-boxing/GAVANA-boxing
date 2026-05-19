"use client";
import { useRef, useState } from "react";
import { addDoc, collection, doc, increment, serverTimestamp, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { db, storage } from "@/lib/firebase";

export function useGymDashboardActions({ gym, setGym, setJoinRequests, setAnnouncements, user, locale, t, setUpdatingId }) {
  const logoInputRef = useRef(null);

  // Registration form state
  const [gymName, setGymName] = useState("");
  const [gymDesc, setGymDesc] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [gymType, setGymType] = useState("Boxing");
  const [specialties, setSpecialties] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [website, setWebsite] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // Announcement form state
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [annPosting, setAnnPosting] = useState(false);
  const [annSuccess, setAnnSuccess] = useState(false);
  const [annError, setAnnError] = useState("");

  const toggleSpecialty = (s) => setSpecialties((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]);
  const toggleAmenity = (a) => setAmenities((p) => p.includes(a) ? p.filter((x) => x !== a) : [...p, a]);

  const handleLogoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleRegister = async () => {
    if (!gymName.trim()) {
      setRegisterError(t("gymDashNameRequired"));
      return;
    }
    setRegisterError("");
    setSubmitting(true);
    try {
      let logoUrl = "";
      if (logoFile) {
        setUploading(true);
        const storageRef = ref(storage, `gyms/${user.uid}/${Date.now()}_logo`);
        const snapshot = await new Promise((resolve, reject) => {
          const task = uploadBytesResumable(storageRef, logoFile);
          task.on("state_changed", (s) => setUploadProgress(Math.round((s.bytesTransferred / s.totalBytes) * 100)), reject, () => resolve(task.snapshot));
        });
        logoUrl = await getDownloadURL(snapshot.ref);
        setUploading(false);
      }
      const gymDoc = await addDoc(collection(db, "gyms"), {
        ownerId: user.uid,
        gymName: gymName.trim(),
        description: gymDesc.trim(),
        country: country.trim(),
        city: city.trim(),
        district: district.trim(),
        address: address.trim(),
        gymType,
        specialties,
        amenities,
        phone: phone.trim(),
        instagram: instagram.trim(),
        website: website.trim(),
        logo: logoUrl,
        images: logoUrl ? [logoUrl] : [],
        verified: false,
        rating: 0,
        totalReviews: 0,
        memberCount: 0,
        subscriptionTier: "free",
        createdAt: serverTimestamp(),
      });
      setGym({ id: gymDoc.id, gymName: gymName.trim(), ownerId: user.uid });
      setRegisterSuccess(true);
    } catch (e) {
      console.error("gym register error", e);
      setRegisterError(t("gymRegisterError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinAction = async (req, action) => {
    setUpdatingId(req.id);
    try {
      await updateDoc(doc(db, "gym_join_requests", req.id), {
        status: action,
        reviewedAt: serverTimestamp(),
      });
      if (action === "approved") {
        await updateDoc(doc(db, "gyms", gym.id), { memberCount: increment(1) });
        setGym((g) => ({ ...g, memberCount: (g.memberCount || 0) + 1 }));
        if (req.userId) {
          await addDoc(collection(db, "notifications"), {
            recipientId: req.userId,
            actorId: user.uid,
            actorName: gym.gymName || "Gym",
            fromUserId: user.uid,
            fromUsername: gym.gymName || "Gym",
            fromUserPhotoURL: gym.logo || "",
            type: "gym_approved",
            message: t("notifGymApproved"),
            gymId: gym.id,
            read: false,
            createdAt: serverTimestamp(),
          });
        }
      } else {
        if (req.userId) {
          await addDoc(collection(db, "notifications"), {
            recipientId: req.userId,
            actorId: user.uid,
            actorName: gym.gymName || "Gym",
            fromUserId: user.uid,
            fromUsername: gym.gymName || "Gym",
            fromUserPhotoURL: gym.logo || "",
            type: "gym_declined",
            message: t("notifGymDeclined"),
            read: false,
            createdAt: serverTimestamp(),
          });
        }
      }
      setJoinRequests((prev) => prev.filter((r) => r.id !== req.id));
    } catch (e) {
      console.error("join action error", e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePostAnnouncement = async () => {
    if (!annTitle.trim()) return;
    setAnnPosting(true);
    setAnnError("");
    try {
      const newAnn = await addDoc(collection(db, "gym_announcements"), {
        gymId: gym.id,
        ownerId: user.uid,
        title: annTitle.trim(),
        body: annBody.trim(),
        createdAt: serverTimestamp(),
      });
      setAnnouncements((prev) => [{ id: newAnn.id, title: annTitle.trim(), body: annBody.trim(), createdAt: null }, ...prev]);
      setAnnTitle("");
      setAnnBody("");
      setAnnSuccess(true);
      setTimeout(() => setAnnSuccess(false), 3000);
    } catch {
      setAnnError(t("gymAnnouncementError"));
    } finally {
      setAnnPosting(false);
    }
  };

  return {
    logoInputRef,
    gymName, setGymName, gymDesc, setGymDesc,
    country, setCountry, city, setCity, district, setDistrict, address, setAddress,
    gymType, setGymType, specialties, amenities, phone, setPhone, instagram, setInstagram, website, setWebsite,
    logoFile, logoPreview, uploading, uploadProgress, submitting, registerError, registerSuccess,
    annTitle, setAnnTitle, annBody, setAnnBody, annPosting, annSuccess, annError,
    toggleSpecialty, toggleAmenity,
    handleLogoSelect, handleRegister, handleJoinAction, handlePostAnnouncement,
  };
}
