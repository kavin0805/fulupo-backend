import FulupoSoft from '../../modules/onBoarding/FulupoSoft.js';

export const addFulupoSoft = async (req, res) => {
  try {
    const soft = new FulupoSoft(req.body);
    await soft.save();
    res.status(201).json(soft);
  } catch (err) {
    res.status(400).json({ message: 'Error adding FulupoSoft', error: err.message });
  }
};

// 4) Get FulupoSoft (dummy static for now)
export const getFulupoSoft = async (req, res) => {
   const fulupoSoft = await FulupoSoft.find();
    res.json({data : fulupoSoft});
};

export const updateFulupoSoft = async (req, res) => {
  try {
    const soft = await FulupoSoft.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!soft) return res.status(404).json({ message: 'FulupoSoft not found' });
    res.json(soft);
  } catch (err) {
    res.status(400).json({ message: 'Error updating FulupoSoft', error: err.message });
  }
};

export const deleteFulupoSoft = async (req, res) => {
  try {
    const soft = await FulupoSoft.findByIdAndDelete(req.params.id);
    if (!soft) return res.status(404).json({ message: 'FulupoSoft not found' });
    res.json({ message: 'FulupoSoft deleted successfully' });
  } catch (err) {
    res.status(400).json({ message: 'Error deleting FulupoSoft', error: err.message });
  }
};
