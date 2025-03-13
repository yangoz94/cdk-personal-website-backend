import { Entity, Model } from "dynamodb-onetable";
import { DDBInstance } from "./ddb-instance.js";

const Match = {
  ulid: /^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$/,
  email:
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  name: /^[a-z0-9 ,.'-]+$/i,
  username: /^[a-z0-9_]{3,30}$/i,
};

export const Schema = {
  format: "onetable:1.1.0",
  version: "0.0.1",
  indexes: {
    primary: { hash: "PK", sort: "SK" },
  },
  models: {
    /* User model */
    User: {
      PK: { type: String, value: "USER#${user_id}", required: true },
      SK: { type: String, value: "PROFILE#${user_id}", required: true },
      user_id: {
        type: String,
        generate: "ulid",
        validate: Match.ulid,
      },
      username: { type: String, required: true, validate: Match.username },
      email: { type: String, required: true, validate: Match.email },
      profile_picture_s3_key: { type: String, required: true },
      bio: { type: String, required: true },
      role: { type: String, required: true, default: "user" },
    },
    /* Blog model */
    Blog: {
      PK: { type: String, value: "BLOG#${blog_id}", required: true },
      SK: { type: String, value: "METADATA#${blog_id}", required: true },
      blog_id: {
        type: String,
        generate: "ulid",
        validate: Match.ulid,
      },
      title: { type: String, required: true },
      description: { type: String, required: true },
      tags: { type: Array, default: [] },
      category: { type: String, required: true },
      subcategory: { type: String, required: true },
      content_s3_key: { type: String, required: true },
      author: { type: String, required: true },
    },
    /* Project model */
    Project: {
      PK: { type: String, value: "PROJECT#${project_id}", required: true },
      SK: { type: String, value: "METADATA#${project_id}", required: true },
      project_id: {
        type: String,
        generate: "ulid",
        validate: Match.ulid,
      },
      name: { type: String, required: true, validate: Match.name },
      description: { type: String, required: true },
      tags: { type: Array, default: [] },
      tech_stack: { type: Array, default: [] },
      live_url: { type: String, required: false },
      github_url: { type: String, required: true },
      images_s3_keys: { type: Array, required: true },
    },
  },
  params: {
    timestamps: true,
    isodates: true,
    separator: "#",
  },
};

/* Type definitions */
export type UserType = Entity<typeof Schema.models.User>;
export type ProjectType = Entity<typeof Schema.models.Project>;
export type BlogType = Entity<typeof Schema.models.Blog>;
