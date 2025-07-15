const isAdmin = (req, res, next) => {    
    if (req.user.role !== 'masterAdmin') {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    next();
  };
  
  export default isAdmin;
  

  export const isAdEmp= (req, res, next) => {   
      if (req.user.role !== 'employee' && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied." });
      }
      next();
    };

      export const isCustomer= (req, res, next) => {   
      if (req.user.role !== 'customer') {
        return res.status(403).json({ message: "Access denied." });
      }
      next();
    };
    