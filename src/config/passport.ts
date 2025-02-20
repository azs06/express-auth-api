import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import passport from "passport";
import { users } from "../schema/index.ts";
import { db } from "./db.ts";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET as string,
};

const getExistingUser = async (id) => {
  const user = await db.select().from(users).where(eq(users.id, id));
  return user.length ? user[0] : null;
};

passport.use(
  new JwtStrategy(opts, async (jwt_payload, done) => {
    try {
      const user = await getExistingUser(jwt_payload.id);
      if (user) {
        return done(null, { id: user.id, roleId: user.roleId });
      }
      return done(null, false);
    } catch (error) {
      return done(error, false);
    }
  })
);

export { passport };

export default passport;
