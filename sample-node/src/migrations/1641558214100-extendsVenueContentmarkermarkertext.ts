import {MigrationInterface, QueryRunner} from "typeorm";

export class extendsVenueContentmarkermarkertext1641558214100 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE `venue_content_markers` ADD `is_info_marker_text` int AFTER `hotspot_marker_name`',
          );
    }



    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE `venue_content_markers` DROP COLUMN `is_info_marker_text` ');
    }

}
