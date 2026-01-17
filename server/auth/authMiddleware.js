import jwt from "jsonwebtoken";



export const UrlAuthentication = async (req, res) => {
    try {
        const token = req.cookies?.accessToken;

        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }

        const decode = jwt.verify(token, process.env.JWT_SECRET);
        return res.status(200).json(decode);

    } catch (err) {

        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired" });
        }

        if (err.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Invalid token" });
        }

        return res.status(500).json({ message: err.message });
    }
};


export const verifyAuth = (req, res, next) => {
    try {
        const token = req.cookies?.accessToken;

        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.account = decoded; // store decoded user data
        next();

    } catch (err) {
        return res.status(403).json({ message: err.message});
    }
};



