import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function startConversation(currentUser, recipientId, recipientData = {}) {
  const q = query(collection(db, "conversations"), where("members", "array-contains", currentUser.uid));
  const snap = await getDocs(q);
  const existing = snap.docs.find((d) => d.data().members.includes(recipientId));
  if (existing) return existing.id;

  const ref = await addDoc(collection(db, "conversations"), {
    members: [currentUser.uid, recipientId],
    memberDetails: {
      [currentUser.uid]: {
        displayName: currentUser.displayName || "",
        photoURL: currentUser.photoURL || "",
      },
      [recipientId]: {
        displayName: recipientData.displayName || recipientData.username || "",
        photoURL: recipientData.photoURL || recipientData.profileImageUrl || "",
      },
    },
    lastMessage: "",
    lastMessageAt: serverTimestamp(),
    lastMessageSenderId: null,
    unreadCount: { [currentUser.uid]: 0, [recipientId]: 0 },
    createdAt: serverTimestamp(),
  });
  return ref.id;
}
