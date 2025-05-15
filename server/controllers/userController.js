import userModel from "../models/userModel.js";

export const getUserData = async (req, res) => {
    console.log("inside this")
  try {
    const {userId} = req.body;
    console.log("hello")
    const user = await userModel.findById(userId);

    if (!user) {
      res.json({ success: false, message: "Invalid Credentials" }); //User Not Found
    }

    res.json({
      success: true,
      userData: {
        name: user.name,
        isAccountVerified: user.isAccountVerified,
      },
    });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};
