import { query } from "./lib/db.ts";
async function test() {
    try {
        await query(`CREATE TABLE IF NOT EXISTS drip_campaigns (
              id VARCHAR(255) PRIMARY KEY,
              lead_id VARCHAR(255),
              status VARCHAR(50) DEFAULT 'Pending',
              next_action_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              sequence_step INT DEFAULT 0,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          )`);
        console.log("Success");
    } catch (err) {
        console.error(err);
    }
}
test();
