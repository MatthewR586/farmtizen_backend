const pool = require("./db.js");

// Constructor
const Ticket = function (ticket) {
  this.ticket_number = ticket.ticket_number;
  this.user_id = ticket.user_id;
  this.promotion_id = ticket.promotion_id;
};

Ticket.addNewTicket = async (newTicket) => {
  let connection;
  try {
    connection = await pool.getConnection();

    const isAmountValidQuery = `SELECT 
                                  u.telegram_id AS user_id,
                                  u.token_amount - p.price AS difference
                                FROM 
                                  tbl_user u
                                JOIN 
                                  tbl_promotion p ON p.id = ?
                                WHERE 
                                  u.telegram_id = ?`;
    const [isAmountValidResult] = await connection.query(isAmountValidQuery, [newTicket.promotion_id, newTicket.user_id]);
    
    if(isAmountValidResult[0].difference < 0) {
      return { error: true, result: "Token amount is not sufficient"}
    } 
    const isTicketCountValidQuery = `select COUNT(*) as count from tbl_ticket where user_id = ? AND promotion_id = ?;`
    const [isTicketCountValidResult] = await connection.query(isTicketCountValidQuery, [newTicket.user_id, newTicket.promotion_id]);
    if(isTicketCountValidResult[0].count >= 3) {
      return { error: true, result: "You already bought 3 tickets"}
    } 
    
    const isDateValidQuery = `SELECT
                                * 
                              FROM
                                tbl_promotion 
                              WHERE
                                expired_date > UTC_TIMESTAMP ( ) and id = ?
                              `
    const [isDateValidResult] = await connection.query(isDateValidQuery, [newTicket.promotion_id]);
    if(isDateValidResult.length == 0) {
      return { error: true, result: "promotion is ended."}
    } 

    
    const createNewTicketQuery =  `INSERT INTO tbl_ticket set ?`;

    // Insert the new plant into the database
    const [insertTicketResult] = await connection.query(createNewTicketQuery, [newTicket]);

    const updateQuery = `UPDATE tbl_user SET token_amount = ? WHERE telegram_id = ?`
    const [updateResult] = await connection.query(updateQuery, [isAmountValidResult[0].difference, newTicket.user_id])

    return { result: "created successfully", error: false };

  } catch (err) {
    return { result: "server error", error: true };
  } finally {
    if (connection) connection.release();
  }
}


module.exports = Ticket;
