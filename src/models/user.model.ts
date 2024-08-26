import mongoose, { Document, Model, ObjectId } from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import { roles } from '../config/roles';
import toJSON from './plugins/toJSON.plugin';
import paginate from './plugins/paginate.plugin';

// Interface for User methods
interface UserSchemaMethods {
  isPasswordMatch(password: string): Promise<boolean>;
}

// Interface for User model statics
interface UserModel extends Model<UserDocument, {}, UserSchemaMethods> {
  paginate(filter: object, options: { sortBy?: string; limit?: number; page?: number }): unknown;
  isEmailTaken(email: string, excludeUserId?: ObjectId): Promise<boolean>;
}

// Interface for the User document
interface UserDocument extends Document, UserSchemaMethods {
  name: string;
  email: string;
  password: string;
  role: string;
  isEmailVerified: boolean;
}

const userSchema = new mongoose.Schema<UserDocument, UserModel>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value: string) {
        if (!validator.isEmail(value)) {
          throw new Error('Invalid email');
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
      validate(value: string) {
        if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
          throw new Error('Password must contain at least one letter and one number');
        }
      },
      private: true, // used by the toJSON plugin
    },
    role: {
      type: String,
      enum: roles,
      default: 'user',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
userSchema.plugin(toJSON as any);
userSchema.plugin(paginate as any);

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
userSchema.statics.isEmailTaken = async function (email: string, excludeUserId?: ObjectId): Promise<boolean> {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};

/**
 * Check if password matches the user's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
userSchema.methods.isPasswordMatch = async function (password: string): Promise<boolean> {
  const user = this;
  return bcrypt.compare(password, user.password);
};

userSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

/**
 * @typedef User
 */
const User = mongoose.model<UserDocument, UserModel>('User', userSchema);

export default User;
