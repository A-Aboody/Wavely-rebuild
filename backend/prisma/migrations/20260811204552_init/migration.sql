
CREATE TYPE "WaveType" AS ENUM ('PERSONAL', 'COMMUNITY');

CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO');

CREATE TYPE "NotificationType" AS ENUM ('LIKE', 'COMMENT', 'FOLLOW', 'RATING', 'MENTION');

CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'GOOGLE', 'FACEBOOK', 'TWITTER');

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "password" TEXT,
    "bio" TEXT,
    "profileImage" TEXT,
    "bannerImage" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationCode" TEXT,
    "emailVerificationExpires" TIMESTAMP(3),
    "passwordResetToken" TEXT,
    "passwordResetExpires" TIMESTAMP(3),
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "provider" "AuthProvider" NOT NULL DEFAULT 'LOCAL',
    "providerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Wave" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT,
    "category" TEXT,
    "location" TEXT,
    "waveType" "WaveType" NOT NULL DEFAULT 'PERSONAL',
    "mediaType" "MediaType",
    "mediaUrls" TEXT[],
    "thumbnailUrl" TEXT,
    "personalRating" DOUBLE PRECISION,
    "communityRatingScale" INTEGER,
    "averageRating" DOUBLE PRECISION,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "commentsCount" INTEGER NOT NULL DEFAULT 0,
    "savesCount" INTEGER NOT NULL DEFAULT 0,
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Wave_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "waveId" TEXT NOT NULL,
    "parentCommentId" TEXT,
    "likesCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Like" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "waveId" TEXT NOT NULL,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommentLike" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,

    CONSTRAINT "CommentLike_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Save" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "waveId" TEXT NOT NULL,

    CONSTRAINT "Save_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "waveId" TEXT NOT NULL,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Follow" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "content" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

CREATE INDEX "User_username_idx" ON "User"("username");

CREATE INDEX "User_email_idx" ON "User"("email");

CREATE INDEX "User_emailVerificationCode_idx" ON "User"("emailVerificationCode");

CREATE INDEX "User_passwordResetToken_idx" ON "User"("passwordResetToken");

CREATE INDEX "Wave_userId_idx" ON "Wave"("userId");

CREATE INDEX "Wave_waveType_idx" ON "Wave"("waveType");

CREATE INDEX "Wave_category_idx" ON "Wave"("category");

CREATE INDEX "Wave_createdAt_idx" ON "Wave"("createdAt");

CREATE INDEX "Comment_waveId_idx" ON "Comment"("waveId");

CREATE INDEX "Comment_userId_idx" ON "Comment"("userId");

CREATE INDEX "Comment_parentCommentId_idx" ON "Comment"("parentCommentId");

CREATE INDEX "Like_userId_idx" ON "Like"("userId");

CREATE INDEX "Like_waveId_idx" ON "Like"("waveId");

CREATE UNIQUE INDEX "Like_userId_waveId_key" ON "Like"("userId", "waveId");

CREATE INDEX "CommentLike_userId_idx" ON "CommentLike"("userId");

CREATE INDEX "CommentLike_commentId_idx" ON "CommentLike"("commentId");

CREATE UNIQUE INDEX "CommentLike_userId_commentId_key" ON "CommentLike"("userId", "commentId");

CREATE INDEX "Save_userId_idx" ON "Save"("userId");

CREATE INDEX "Save_waveId_idx" ON "Save"("waveId");

CREATE UNIQUE INDEX "Save_userId_waveId_key" ON "Save"("userId", "waveId");

CREATE INDEX "Rating_userId_idx" ON "Rating"("userId");

CREATE INDEX "Rating_waveId_idx" ON "Rating"("waveId");

CREATE UNIQUE INDEX "Rating_userId_waveId_key" ON "Rating"("userId", "waveId");

CREATE INDEX "Follow_followerId_idx" ON "Follow"("followerId");

CREATE INDEX "Follow_followingId_idx" ON "Follow"("followingId");

CREATE UNIQUE INDEX "Follow_followerId_followingId_key" ON "Follow"("followerId", "followingId");

CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

ALTER TABLE "Wave" ADD CONSTRAINT "Wave_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Comment" ADD CONSTRAINT "Comment_waveId_fkey" FOREIGN KEY ("waveId") REFERENCES "Wave"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Like" ADD CONSTRAINT "Like_waveId_fkey" FOREIGN KEY ("waveId") REFERENCES "Wave"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommentLike" ADD CONSTRAINT "CommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Save" ADD CONSTRAINT "Save_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Save" ADD CONSTRAINT "Save_waveId_fkey" FOREIGN KEY ("waveId") REFERENCES "Wave"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Rating" ADD CONSTRAINT "Rating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Rating" ADD CONSTRAINT "Rating_waveId_fkey" FOREIGN KEY ("waveId") REFERENCES "Wave"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
