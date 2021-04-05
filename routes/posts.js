const express = require("express");

const router = express.Router();

const postController = require("../controllers/posts");
const checkAuth = require("../middlewares/check-auth");
const extractFile = require("../middlewares/file");

router.post("", checkAuth, extractFile, postController.createPost);

router.put("/:id", checkAuth, extractFile, postController.updatePost);

router.get("", postController.getAllPosts);

router.get("/:id", postController.getPostById);

router.delete("/:id", checkAuth, postController.deletePost);

module.exports = router;
