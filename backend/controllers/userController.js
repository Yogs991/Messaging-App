require("dotenv").config();
const prisma = require("../lib/prisma.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

async function getMe(req, res){
    res.json(req.user);
}

async function createUser(req, res){
    try {
        const {username, email, password} = req.body;
        if(!email || !username || !password){
            return res.status(400).json({message: "Userame, email, password are required "});
        }

        const existingUser = await prisma.user.findUnique({
            where:{email}
        });

        if(!existingUser){
            return res.status(400).json({message: "User already exists"});
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const createUser = await prisma.user.create({
            data:{
                username,
                email,
                password: hashedPassword
            }
        });

        res.status(201).json({
            message: "User registered successfully",
            user:{
                id: createUser.id,
                username: createUser.username,
                email: createUser.email,
                pasword: createUser.password
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function loginUser(req,res){
    try {
        const {email, password} = req.body;

        //Check for empty fields
        if(!email || !password){
            return res.status(400).json({message: "Email and password are required"})
        }

        const user = await prisma.user.findUnique({
            where:{email},
            select:{
                id: true,
                username: true,
                email:true,
                password: true
            }
        });

        //Check for invalid email
        if(!user){
            return res.status(401).json({error: "Invalid email"});
        }

        //Check for invalid password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if(!passwordMatch){
            return res.status(401).json({error: "Invalid password"});
        }

        const token = jwt.sign(
            {userId: user.id, userName: user.username, userEmail: user.email},
            process.env.JWT_SECRET,
            {expiresIn: process.env.JWT_EXPIRES_IN}
        );

        res.status(200).json({
            message: "Login successfull",
            token,
            user:{
                id: user.id,
                username: user.username,
                emai: user.email
            }
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function searchUsers(req, res){
    try {
        const {search, limit} = req.query;
        if(!search || typeof search !== "string"){
            return res.status(400).json({message: "Search query is required"});
        }

        const query = search.trim();
        const currentUserId = req.user.id;
        //Converts search query's limit from string to number, sets it at default 15, max 20 and min 1
        const safeLimit = Math.min(
            Math.max(Number(limit) || 15,1),
            20
        );

        const users = await prisma.user.findMany({
            where:{
                AND: [
                    {
                        username:{
                            contains: query,
                            mode: "insensitive"
                        },
                    },
                    {
                        NOT: {
                            id: currentUserId,
                        }
                    }
                ]
            },
            take: safeLimit,
            select:{
                id: true,
                username: true,
            },
        });

        return res.json(users);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function getProfile(req, res){
    try{
        const {id} = req.params;
        const user = await prisma.user.findUnique({
            where: {id},
            select: {
                id: true,
                username: true,
            }
        });
        return res.json(user);
    }catch(error){
        console.log(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

//Add later avatar url images display names? and update function?

module.exports = {
    getMe,
    createUser,
    loginUser,
    searchUsers,
    getProfile
}