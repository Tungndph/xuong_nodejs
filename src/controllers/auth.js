import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import User from "../models/UserModel";
import { registerValidator, loginValidator } from "../validations/auth";
import ApiError from "../utils/ApiError";

class AuthController {
  async register(req, res, next) {
    try {
      //B1: validate: email, password, username
      const { email, username, avatar, password } = req.body;
      const { error } = registerValidator.validate(req.body);
      if (error) {
        const errors = error.details.map((err) => err.message).join(", ");
        throw new ApiError(StatusCodes.BAD_REQUEST, errors);
      }
      // b2: validate email exitsing
      const emailExist = await User.findOne({ email });
      if (emailExist)
        throw new ApiError(StatusCodes.BAD_REQUEST, "Email đã được đăng kí");
      // b3 ma hoa password
      const hashPassword = await bcryptjs.hash(password, 10);
      // update db
      const user = await User.create({
        email,
        username,
        avatar,
        password: hashPassword,
      });
      // b4 remove password in res
      res.status(StatusCodes.OK).json({
        message: "Create Successfully!",
        data: { ...user.toObject(), password: undefined },
      });
    } catch (error) {
      next(error);
    }
  }

  // POST: auth/login: email, password
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      //B1: validate: email, password
      const { error } = loginValidator.validate(req.body);
      if (error) {
        const errors = error.details.map((err) => err.message).join(", ");
        throw new ApiError(StatusCodes.BAD_REQUEST, errors);
      }
      // check email xem co trong db
      const checkUser = await User.findOne({ email });
      if (!checkUser)
        throw new ApiError(StatusCodes.BAD_REQUEST, "Tài khoản không tồn tại");

      // so sanh password: bcryptjs
      const checkPassword = await bcryptjs.compare(
        password,
        checkUser.password
      );
      if (!checkPassword)
        throw new ApiError(StatusCodes.BAD_REQUEST, "Tài khoản không tồn tại");

      // ma hoa token
      const token = jwt.sign({ id: checkUser._id }, "key", {
        expiresIn: "1d",
      });
      // res
      res.status(StatusCodes.OK).json({
        message: "Login Successfully!",
        user: { ...checkUser.toObject(), password: undefined },
        token,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
