import * as jwt from "jsonwebtoken"

import { isString } from "util"
import { PRIVATE_GITHUB_SIGNING_KEY, PUBLIC_GITHUB_SIGNING_KEY } from "../../globals"

// A JWT is a special type of string
type JWT = string

type PerilUserJWT = JWT

// The Decoded JWT data
export interface PerilJWT {
  exp?: number
  iat: number
  iss: string[]
  data: {
    user: PerilOAuthUser
  }
}

export interface PerilOAuthUser {
  name: string
  avatar_url: string
}

/**
 * Takes a user with details from GH Oauth and generates
 * a JWT which can be used to make authenticated requests
 * against Peril.
 */
export const createPerilUserJWT = (user: PerilOAuthUser, installationIDs: number[]): PerilUserJWT => {
  const now = Math.round(new Date().getTime() / 1000)
  const keyContent = PRIVATE_GITHUB_SIGNING_KEY
  const payload: PerilJWT = {
    iat: now,
    iss: installationIDs.map(id => String(id)),
    data: {
      user,
    },
  }

  return jwt.sign(payload, keyContent, { algorithm: "RS256", expiresIn: "90 days" })
}

/**
 * Decode and verifies a JWT generated by createPerilJWT above
 * @param token the JWT
 */
export const getDetailsFromPerilJWT = (token: PerilUserJWT) =>
  new Promise<PerilJWT>((res, rej) => {
    const options = { algorithms: ["RS256"] }
    jwt.verify(token, PUBLIC_GITHUB_SIGNING_KEY, options, (err, decoded) => {
      if (err) {
        rej(err)
      } else {
        if (isString(decoded)) {
          res(JSON.parse(decoded as string))
        } else {
          res(decoded as any)
        }
      }
    })
  })
