import jwt from "jsonwebtoken";

// Sign a JWT for a user id
export const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });

// Sign token, set it as an httpOnly cookie, and return it
export const sendTokenCookie = (res, id) => {
  const token = signToken(id);
  const days = parseInt(process.env.JWT_COOKIE_DAYS || "7", 10);
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: days * 24 * 60 * 60 * 1000,
  });
  return token;
};
