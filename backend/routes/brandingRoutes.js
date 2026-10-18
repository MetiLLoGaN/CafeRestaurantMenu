const express = require("express");
const router = express.Router();
const {
  getBranding,
  updateBranding,
  uploadLogo,
  deleteLogo,
} = require("../controllers/brandingController");
const auth = require("../middleware/authMiddleware");
const {
  logoUpload,
  validateLogoSignature,
  handleUploadError,
} = require("../middleware/imageUpload");

router.route("/").get(auth, getBranding).put(auth, updateBranding);

/* Logo upload: auth first (multer's filename callback needs req.user),
   then logo-specific storage rules, unified error mapping, and a
   file-signature check before anything touches the database. */
router.post(
  "/logo",
  auth,
  logoUpload.single("logo"),
  handleUploadError,
  validateLogoSignature,
  uploadLogo,
);
router.delete("/logo", auth, deleteLogo);

module.exports = router;
