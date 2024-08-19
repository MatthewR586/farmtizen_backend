const pool = require("./db.js");

// Constructor
const Promtion = function (promtoin) {
  this.title = promtoin.title;
  this.description = promtoin.description;
  this.end_date = promtoin.end_date;
  this.expired_date = promtoin.expired_date;
  this.price = promtoin.price;
  this.ticket_count = promtoin.ticket_count;
};


Promtion.getPromotion = async (pageIndex) => {
  let connection;
  try {
    const getPromotionQuery = `select * from tbl_promotion WHERE expired_date > UTC_TIMESTAMP() order by expired_date limit 10 offset ?`;
    connection = await pool.getConnection();

    // Insert the new plant into the database
    const [getPromotionResult] = await connection.query(getPromotionQuery, [(pageIndex - 1) * 10]);
    return { result: getPromotionResult, error: null };

  } catch (err) {
    return { result: null, error: err };
  } finally {
    if (connection) connection.release();
  }
}

Promtion.getAllPromotions = async (pageIndex) => {
  let connection;
  try {
    const getPromotionQuery = `select * from tbl_promotion order by expired_date desc`;
    connection = await pool.getConnection();

    // Insert the new plant into the database
    const [getPromotionResult] = await connection.query(getPromotionQuery);
    return { result: getPromotionResult, error: null };

  } catch (err) {
    return { result: null, error: err };
  } finally {
    if (connection) connection.release();
  }
}
Promtion.getPurchasedPromotion = async (id, pageIndex) => {
  let connection;
  try {
    const getPromotionQuery = `SELECT
                                  tbl_promotion.id,
                                  tbl_promotion.title,
                                  tbl_promotion.description,
                                  tbl_promotion.expired_date,
                                  u_gold.NAME AS gold_name,
                                  u_silver.NAME AS silver_name,
                                  u_bronze.NAME AS bronze_name 
                                FROM
                                  tbl_ticket
                                  LEFT JOIN tbl_promotion ON tbl_promotion.id = tbl_ticket.promotion_id
                                  LEFT JOIN tbl_user u_gold ON tbl_promotion.gold = u_gold.telegram_id
                                  LEFT JOIN tbl_user u_silver ON tbl_promotion.silver = u_silver.telegram_id
                                  LEFT JOIN tbl_user u_bronze ON tbl_promotion.bronze = u_bronze.telegram_id 
                                WHERE
                                  user_id = ? 
                                GROUP BY
                                  tbl_promotion.id, 
                                  tbl_promotion.title,
                                  tbl_promotion.description,
                                  tbl_promotion.expired_date,
                                  u_gold.NAME,
                                  u_silver.NAME,
                                  u_bronze.NAME
                                ORDER BY
                                  tbl_promotion.expired_date 
                                  LIMIT 10 OFFSET ?`;
    connection = await pool.getConnection();

    // Get purchased promotion
    const [getPromotionResult] = await connection.query(getPromotionQuery, [id, (pageIndex - 1) * 10]);
    const returnValue = [];
    
    for (let i = 0; i < getPromotionResult.length; i++) {
      const promotion = getPromotionResult[i];
      const getTicketQuery = `select * from tbl_ticket where user_id = ? and promotion_id = ?`
      const getTicketResult = await connection.query(getTicketQuery, [id, promotion.id]);

      returnValue.push({
        ...promotion,
        tickets: getTicketResult[0]
      })
      
    }
    
    return { result: returnValue, error: null };

  } catch (err) {
    return { result: null, error: err };
  } finally {
    if (connection) connection.release();
  }
}

Promtion.getDetail = async (userTelegramId, promotionId) => {
  let connection;
  try {
    const getPromotionQuery = `SELECT
                                  p.title,
                                  p.description,
                                  p.expired_date,
                                  p.price,
                                  u_gold.NAME AS gold_name,
                                  u_silver.NAME AS silver_name,
                                  u_bronze.NAME AS bronze_name 
                                FROM
                                  tbl_promotion p
                                  LEFT JOIN tbl_user u_gold ON p.gold = u_gold.telegram_id
                                  LEFT JOIN tbl_user u_silver ON p.silver = u_silver.telegram_id
                                  LEFT JOIN tbl_user u_bronze ON p.bronze = u_bronze.telegram_id
                                WHERE
                                  p.id = ?`;
    connection = await pool.getConnection();

    // Insert the new plant into the database
    const [getPromotionResult] = await connection.query(getPromotionQuery, [promotionId]);

    const getTicketDetailQuery = `select * from tbl_ticket WHERE promotion_id = ? AND user_id = ?`
    const [getTicketResult] = await connection.query(getTicketDetailQuery, [promotionId, userTelegramId]);

    return { result: { promotion: getPromotionResult[0], ticket: getTicketResult }, error: false };

  } catch (err) {
    return { result: "Server error", error: true };
  } finally {
    if (connection) connection.release();
  }
}

Promtion.getPastPromotion = async (pageIndex) => {
  let connection;
  try {
    // const getPastPromotionQuery =  `SELECT
    //                                 p.id,
    //                                 p.title,
    //                                 p.description,
    //                                 p.expired_date
    //                             FROM
    //                                 tbl_promotion p
    //                             JOIN
    //                                 tbl_ticket t ON p.id = t.promotion_id
    //                             WHERE
    //                                 t.user_id = ?
    //                                 AND p.expired_date < UTC_DATE()
    //                             group by p.id
    //                             order by expired_date 
    //                             limit 10 offset ?
    //                             ;`;

    const getPastPromotionQuery = `select * from tbl_promotion WHERE expired_date <= UTC_TIMESTAMP() order by expired_date limit 10 offset ?`;

    connection = await pool.getConnection();

    // Insert the new plant into the database
    const [getPastPromotionResult] = await connection.query(getPastPromotionQuery, [(pageIndex - 1) * 10]);
    return { result: getPastPromotionResult, error: null };

  } catch (err) {
    return { result: null, error: err };
  } finally {
    if (connection) connection.release();
  }
}

Promtion.addNewPromotion = async (newPromotion) => {
  let connection;
  try {
    const createNewPromotionQuery = `INSERT INTO tbl_promotion set ?`;
    connection = await pool.getConnection();

    // Insert the new plant into the database
    const [insertPromotionResult] = await connection.query(createNewPromotionQuery, [newPromotion]);
    return { result: insertPromotionResult, error: null };

  } catch (err) {
    return { result: null, error: err };
  } finally {
    if (connection) connection.release();
  }
}


module.exports = Promtion;
