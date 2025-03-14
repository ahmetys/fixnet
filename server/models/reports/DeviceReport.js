import pool from "../../config/database.js";

// Device Reports
export const getDeviceStats = async () => {
  try {
    // Brand distribution
    const [brandDistribution] = await pool.query(
      `SELECT 
        db.device_brand_name, 
        COUNT(t.ticket_id) as ticket_count
       FROM device_brands db
       LEFT JOIN tickets t ON db.device_brand_id = t.device_brand_id
       WHERE t.ticket_delivered = TRUE
       GROUP BY db.device_brand_id
       ORDER BY ticket_count DESC`
    );

    // Type distribution
    const [typeDistribution] = await pool.query(
      `SELECT 
        dt.device_type_name, 
        COUNT(t.ticket_id) as ticket_count
       FROM device_types dt
       LEFT JOIN tickets t ON dt.device_type_id = t.device_type_id
       WHERE t.ticket_delivered = TRUE
       GROUP BY dt.device_type_id
       ORDER BY ticket_count DESC`
    );

    // Model distribution
    const [modelDistribution] = await pool.query(
      `SELECT 
        dm.device_model_name, 
        COUNT(t.ticket_id) as ticket_count
       FROM device_models dm
       LEFT JOIN tickets t ON dm.device_model_id = t.device_model_id
       WHERE t.ticket_delivered = TRUE
       GROUP BY dm.device_model_id
       ORDER BY ticket_count DESC
       LIMIT 10`
    );

    // Brand-type hierarchy
    const [brandTypeHierarchy] = await pool.query(
      `SELECT 
        db.device_brand_name,
        dt.device_type_name,
        COUNT(t.ticket_id) as ticket_count
       FROM device_brands db
       LEFT JOIN device_types dt ON db.device_brand_id = dt.device_brand_id
       LEFT JOIN tickets t ON dt.device_type_id = t.device_type_id
       WHERE t.ticket_delivered = TRUE
       GROUP BY db.device_brand_id, dt.device_type_id
       HAVING dt.device_type_name IS NOT NULL
       ORDER BY db.device_brand_name, ticket_count DESC`
    );

    return {
      brandDistribution,
      typeDistribution,
      modelDistribution,
      brandTypeHierarchy,
    };
  } catch (error) {
    console.error("Error in getDeviceStats:", error);
    throw error;
  }
};
