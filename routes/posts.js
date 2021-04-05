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
      creator: req.userData.userId,
    });
    post
      .save()
      .then((createdPost) => {
        res.status(200).json({
          message: "Post added successfully!",
          post: {
            ...createdPost,
            id: createdPost._id,
          },
        });
      })
      .catch((err) => {
        res.status(500).json({
          message: "Adding post failed!",
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
      creator: req.userData.userId,
    });
    Post.updateOne({ _id: req.params.id, creator: req.userData.userId }, post)
      .then((result) => {
        if (result.nModified > 0) {
          res.status(200).json({
            message: "Updated successfully!",
          });
        } else {
          res.status(401).json({
            message: "Not authorized!",
          });
        }
      })
      .catch((err) => {
        res.status(500).json({
          message: "Post update failed!",
        });
      });
  }
);

router.get("", (req, res, next) => {
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
    })
    .catch((err) => {
      res.status(500).json({
        message: "Post fetch failed!",
      });
    });
});

router.get("/:id", (req, res, next) => {
  Post.findById({ _id: req.params.id })
    .then((post) => {
      if (post) {
        res.status(200).json(post);
      } else {
        res.status(404).json({ message: "Post not found!" });
      }
    })
    .catch((err) => {
      res.status(500).json({
        message: "Post fetch failed!",
      });
    });
});

router.delete("/:id", checkAuth, (req, res, next) => {
  Post.deleteOne({ _id: req.params.id, creator: req.userData.userId })
    .then((result) => {
      if (result.n > 0) {
        res.status(200).json({
          message: "Deleted successfully!",
        });
      } else {
        res.status(401).json({
          message: "Auth failed!",
        });
      }
    })
    .catch((err) => {
      res.status(500).json({
        message: "Post deletion failed!",
      });
    });
});

module.exports = router;
