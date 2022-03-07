import {MigrationInterface, QueryRunner} from "typeorm";

export class extendsVenueContentMarkersTable1641369380984 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE `venue_content_markers` ADD `hotspot_marker_name` varchar(255) AFTER `marker_id`',
          );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE `venue_content_markers` DROP COLUMN `hotspot_marker_name` ');
    }

}
