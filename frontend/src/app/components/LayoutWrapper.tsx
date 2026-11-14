"use client";

import { useState } from "react";
import Navigation from "./Navigation";
import Footer from "./Footer";
import NotificationToast from "./NotificationToast";
import MessageListModal from "./MessageListModal";
import ChatModal from "./ChatModal";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [chatModalState, setChatModalState] = useState<{
    isOpen: boolean;
    userId: string;
    userName: string;
    userAvatar?: string;
  } | null>(null);

  const handleOpenChat = (
    userId: string,
    userName: string,
    userAvatar?: string
  ) => {
    setChatModalState({
      isOpen: true,
      userId,
      userName,
      userAvatar,
    });
  };

  const handleCloseChat = () => {
    setChatModalState(null);
  };

  return (
    <div className="min-h-screen flex flex-col theme-transition">
      <Navigation />
      <main className="flex-1 pt-16 theme-transition">{children}</main>
      <Footer />
      <NotificationToast onMessageNotificationClick={handleOpenChat} />
      <MessageListModal onOpenChat={handleOpenChat} />
      {chatModalState && (
        <ChatModal
          isOpen={chatModalState.isOpen}
          onClose={handleCloseChat}
          playerId={chatModalState.userId}
          playerName={chatModalState.userName}
          playerAvatar={chatModalState.userAvatar}
        />
      )}
    </div>
  );
}
