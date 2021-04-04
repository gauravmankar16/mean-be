const express = require("express");
const multer = require("multer");
const Post = require("../models/post");

const router = express.Router();

const checkAuth = require("../middlewares/check-auth");

const MIME_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/tiff": "tiff",
  "image/gif": "gif",
};

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    const isValid = MIME_TYPE_MAP[file.mimetype];
    let error = new Error("Invalid mime type");
    if (isValid) {
      error = null;
    }
    callback(error, "images");
  },
  filename: (req, file, callback) => {
    const name = file.originalname.toLocaleLowerCase().split(" ").join("");
    const ext = MIME_TYPE_MAP[file.mimetype];
    callback(null, name + "-" + Date.now() + "." + ext);
  },
});

router.post(
  "",
  checkAuth,
  multer({ storage: storage }).single("image"),
  (req, res, next) => {
    const url = req.protocol + "://" + req.get("host");
    const post = new Post({
      title: req.body.title,
      content: req.body.content,
      imagePath: url + "/images/" + req.file.filename,
    });
    post.save().then((createdPost) => {
      res.status(200).json({
        message: "Added successfully!",
        post: {
          ...createdPost,
          id: createdPost._id,
        },
      });
    });
  }
);

router.put(
  "/:id",
  checkAuth,
  multer({ storage: storage }).single("image"),
  (req, res, next) => {
    let imagePath = req.body.imagePath;
    if (req.file) {
      const url = req.protocol + "://" + req.get("host");
      imagePath = url + "/images/" + req.file.filename;
    } else {
      imagePath = req.body.imagePath;
    }
    const post = new Post({
      _id: req.params.id,
      title: req.body.title,
      content: req.body.content,
      imagePath: imagePath,
    });
    console.log(post);
    Post.updateOne({ _id: req.params.id }, post).then(() => {
      res.status(200).json({
        message: "Updated successfully!",
      });
    });
  }
);

router.get("", (req, res, next) => {
  console.log(req.query);
  const pageSize = +req.query.pageSize;
  const currentPage = +req.query.currentPage;
  const postQuery = Post.find();
  let fetchedPosts;
  if (pageSize && currentPage) {
    postQuery.skip(pageSize * (currentPage - 1)).limit(pageSize);
  }
  postQuery
    .then((documents) => {
      fetchedPosts = documents;
      return Post.countDocuments();
    })
    .then((count) => {
      res.status(200).json({
        message: "Posts fetched successfully!",
        posts: fetchedPosts,
        maxPosts: count,
      });
    });
});

router.get("/:id", (req, res, next) => {
  Post.findById({ _id: req.params.id }).then((post) => {
    if (post) {
      res.status(200).json(post);
    } else {
      res.status(404).json({ message: "Post not found!" });
    }
  });
});

router.delete("/:id", checkAuth, (req, res, next) => {
  Post.deleteOne({ _id: req.params.id }).then((result) => {
    console.log(result);
    res.status(200).json({ message: "Post deleted!" });
  });
});

module.exports = router;
