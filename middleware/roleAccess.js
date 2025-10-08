import SidebarMenu from "../modules/SidebarMenu";

export const checkRoleAccess = async (req, res, next) => {
  const userRole = req.user.role;
  const path = req.originalUrl.split("?")[0]; // Get route without query params

  try {
    // Check if this route exists for the user's role
    const menu = await SidebarMenu.findOne({
      route: path,
      roles: userRole
    });

    if (!menu) {
      return res.status(403).json({ message: "Access denied. You don't have access to this page." });
    }

    next();
  } catch (err) {
    res.status(500).json({ message: "Access check failed", error: err.message });
  }
};
