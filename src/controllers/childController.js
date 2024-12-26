import supabase from "../config/supabaseClient.js";

// Create a new child account
export const createChildAccount = async (req, res) => {
  const {
    child_id,
    gender,
    name,
    date_of_birth,
    weight_at_birth,
    mother_name,
    father_name,
    province,
    municipality,
    ward_no,
    village,
    phone,
    email,
    health_institution_name,
    health_worker_assigned,
    date_of_card_made,
    temporary_password,
  } = req.body;

  if (
    !child_id ||
    !gender ||
    !name ||
    !date_of_birth ||
    !mother_name ||
    !father_name ||
    !province ||
    !municipality ||
    !ward_no ||
    !village ||
    !phone ||
    !health_institution_name ||
    !health_worker_assigned ||
    !date_of_card_made ||
    !temporary_password
  ) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const { data, error } = await supabase.from("children").insert([
      {
        child_id,
        gender,
        name,
        date_of_birth,
        weight_at_birth,
        mother_name,
        father_name,
        province,
        municipality,
        ward_no,
        village,
        phone,
        email,
        health_institution_name,
        health_worker_assigned,
        date_of_card_made,
        temporary_password,
      },
    ]);

    res.status(201).json({
      message: `Child account ${name} has been created.`,
      data: data[0], // Send the first (and only) inserted child
    });
  } catch (err) {
    console.error("Error in try-catch block when adding child:", err); // Log detailed error
    res
      .status(500)
      .json({ error: "Error creating child account", details: err.message }); // Return error with message
  }
};

// Get all children
export const getAllChildren = async (req, res) => {
  try {
    const { data, error } = await supabase.from("children").select("*"); // Fetch all children

    if (error) {
      throw error;
    }

    res.json({ data });
  } catch (err) {
    console.error("Error fetching children:", err.message);
    res.status(500).json({ error: "Error fetching children" });
  }
};

// Get a child by ID
export const getChildById = async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from("children")
      .select("*")
      .eq("child_id", id) // Match by child_id
      .single(); // Expect a single record

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: "Child not found" });
    }

    res.json({ data });
  } catch (err) {
    console.error("Error fetching child:", err.message);
    res.status(500).json({ error: "Error fetching child" });
  }
};

// Update a child account
export const updateChildAccount = async (req, res) => {
  const { id } = req.params;
  const {
    child_id,
    gender,
    name,
    date_of_birth,
    weight_at_birth,
    mother_name,
    father_name,
    province,
    municipality,
    ward_no,
    village,
    phone,
    email,
    health_institution_name,
    health_worker_assigned,
    date_of_card_made,
    temporary_password,
  } = req.body;

  try {
    const { data, error } = await supabase
      .from("children")
      .update({
        child_id,
        gender,
        name,
        date_of_birth,
        weight_at_birth,
        mother_name,
        father_name,
        province,
        municipality,
        ward_no,
        village,
        phone,
        email,
        health_institution_name,
        health_worker_assigned,
        date_of_card_made,
        temporary_password,
      })
      .eq("child_id", id); // Match by child_id

    if (error) {
      throw error;
    }

    if (data.length === 0) {
      return res.status(404).json({ error: "Child not found" });
    }

    res.json({ message: `Child account with ID ${id} has been updated.` });
  } catch (err) {
    console.error("Error updating child account:", err.message);
    res.status(500).json({ error: "Error updating child account" });
  }
};

// Delete a child account
export const deleteChildAccount = async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from("children")
      .delete()
      .eq("child_id", id); // Match by child_id

    if (error) {
      throw error;
    }

    if (data.length === 0) {
      return res.status(404).json({ error: "Child not found" });
    }

    res.json({ message: `Child account with ID ${id} has been deleted.` });
  } catch (err) {
    console.error("Error deleting child account:", err.message);
    res.status(500).json({ error: "Error deleting child account" });
  }
};