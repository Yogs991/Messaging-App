const prisma = require("../lib/prisma.js");

async function getChats(req, res, next){
    try {
        const {cursor, limit} = req.query;
        const currentUserId = req.user.id;
        const safeLimit = Math.min(Number(limit) || 20, 50);
        const chats = await prisma.chat.findMany({
            where:{
                members: {
                    some: {
                        userId: currentUserId,
                    },
                },
            },
            orderBy: [
                {createdAt: "desc"},
                {id: "desc"},
            ],
            take: safeLimit,
            ...(cursor && {
                skip: 1,
                cursor: {id: cursor},
            }),
            include:{
                members:{
                    include:{
                        user:{
                            select:{
                                id: true,
                                username: true,
                                displayName: true,
                                avatarUrl: true
                            },
                        },
                    },
                },
            },
            messages:{
                orderBy: {createdAt: "desc"},
                take: 1,
            }
        });

        return res.json({
            data: chats,
            nextCursor: chats.length ? chats[chats.length - 1].id : null
        });
    } catch (error) {
        next(error);
    }
}

async function createChat(req, res, next){
    try {
        const { userId = [], name} = req.body;
        const currentUserId = req.user.id;
        const uniqueUserIds = [...new Set([currentUserId, ...userId])];
        const isGroup = uniqueUserIds.length > 2;
        const chat = await prisma.chat.create({
            data:{
                name: name || null,
                isGroup,
                createdById: currentUserId,
                members : {
                    create: uniqueUserIds.map((userId)=>({
                        userId,
                    }))
                },
            },
            include: {
                chatMembers: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                displayName: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
            },
        });

        return res.status(201).json(chat);
    } catch (error) {
        next(error);
    }
}

async function getChatById(req, res, next){
    try {
        const {chatId} = req.params;
        const {cursor, limit} = req.query;
        const currentUserId = req.user.id;
        const safeLimit = Math.min(Number(limit) || 50, 100);

        const chat = await prisma.chat.findFirst({
            where:{
                id: chatId,
                chatMembers: {
                    some: {currentUserId},
                },
            },
            include:{
                chatMembers:{
                    include:{
                        user:{
                            select:{
                                id: true,
                                username: true,
                                displayName: true,
                                avatarUrl: true
                            },
                        },
                    },
                },
                messages:{
                    orderBy: { createdAt: "desc"},
                    take: safeLimit,
                    ...(cursor && {
                        skip:1,
                        cursor: { id: cursor}
                    }),
                },
            },
        })
        
        const messages = chat.message || [];
        return res.status(201).json({
            ...chat,
            messages,
            nextCursor: messages.length ? messages[messages.length - 1].id : null,
        });
    } catch (error) {
        next(error);
    }
}

async function editChat(req, res, next){
    try {
        const {chatId} = req.params;
        const {name} = req.body;
        const currentUserId = req.user.id;
        const membership = await prisma.chatMember.findUnique({
            where:{
                userId_chatId:{
                    userId: currentUserId,
                    chatId,
                }
            }
        });

        if(!membership){
            throw new Error("Not authorized to modify chat");
        }

        if (!name || name.trim() === "") {
            throw new Error("Chat name cannot be empty");
        }

        const oldChat = await prisma.chat.findUnique({
            where: {id: chatId},
            select: { name: true},
        });

        const updatedChat = await prisma.chat.update({
            where: {id: chatId},
            data: {
                name,
                updatedAt: new Date()
            },
        });

        if(oldChat?.name === name){
            return oldChat;
        }

        return res.status(201).json(updatedChat);
    } catch (error) {
        next(error);
    }
}

async function addUSerToChat(req, res, next){
    try {
        const {chatId} = req.params;
        const {userId} = req.body;
        const currentUserId = req.user.id;
        
        const memberShip = await prisma.chatMember.findUnique({
            where:{
                userId_chatId:{
                    userId: currentUserId,
                    chatId,
                }
            }
        });

        if(!memberShip){
            throw new Error("Not authorized to modify this chat");
        }

        const existing = await prisma.chatMember.findUnique({
            where:{
                userId_chatId:{
                    userId: currentUserId,
                    chatId,
                }
            }
        });

        if(!existing){
            await prisma.chatMember.create({
                data:{
                    chatId,
                    userId,
                }
            });
        }
        
        const memberCount = await prisma.chatMember.count({
            where: { chatId },
        });

        await prisma.chat.update({
            where: {id: chatId},
            data:{
                isGroup: memberCount > 2,
                updatedAt: new Date(),
            }
        });

        const updatedChat = await prisma.chat.findFirst({
            where:{
                id: chatId,
                chatMembers:{
                    some: {userId: currentUserId}
                },
            },
            include:{
                chatMembers:{
                    include:{
                        user:{
                            select:{
                                id: true,
                                username: true,
                                displayName: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
                messages:{
                    orderBy:{
                        createdAt: "desc",
                    },
                    take: 50,
                },
            },
        });

        return res.status(201).json(updatedChat);
    } catch (error) {
        next(error);
    }
}

async function removeUser(req, res, next){
    try {
        const {chatId} = req.params;
        const currentUserId = req.user.id;

        const membership = await prisma.chatMember.findUnique({
            where: {
                userId_chatId: {
                    userId: currentUserId,
                    chatId,
                },
            },
        });

        if (!membership) {
            throw new Error("Not authorized to modify this chat");
        }

        await prisma.chatMember.delete({
            where: {
                userId_chatId: {
                    userId: currentUserId,
                    chatId,
                },
            },
        });

        const memberCount = await prisma.chatMember.count({
            where: { chatId },
        });

        await prisma.chat.update({
            where: {id: chatId},
            data:{
                isGroup : memberCount > 2,
                updatedAt: new Date(),
            }
        });

    res.status(204).end();

    } catch (error) {
        next(error);
    }
}

module.exports = {
    createChat,
    getChatById,
    editChat,
    addUSerToChat,
    removeUser
}