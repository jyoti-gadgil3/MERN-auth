import jwt from "jsonwebtoken";

const userAuth = async (req, res, next) => {
  const { token } = req.cookies;
  if (!token) {
    return res.json({ success: false, message: "Not Autherized! Login Again" });
  }
  try {
    // To verify and Decode the token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch the user if from the decoded token and add it to request body
    if (decodedToken.id) {
      req.body.userId = decodedToken.id;
    } else {
      return res.json({ success: false, message: "Not Autherized! Login Again" });
    }

    next();
  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
};

export default userAuth;