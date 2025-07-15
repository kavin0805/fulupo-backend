import SidebarMenu from '../modules/SidebarMenu.js'

export const checkSidebarAccess = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    const path = req.originalUrl.split('?')[0]; // Strip query params

    // Find a menu item with this route
     const menuItem = await SidebarMenu.findOne({ route: path });

     const allMenus = await SidebarMenu.find();
     console.log("All Menu Routes:", allMenus.map(m => m.route));
    

    if (!menuItem) {
      return res.status(404).json({ message: "Page not found in sidebar menu" });
    }    

    // Check if user role is allowed
    if (!menuItem.roles.includes(userRole)) {
      return res.status(403).json({ message: "Access declined: You don't have access to this page" });
    }

    next();
  } catch (err) {
    return res.status(500).json({ message: err.message || "Something went wrong" });
  }
};
