import { MigrationInterface, QueryRunner } from 'typeorm';

export class addColumnsToVenueContentMarkerTable1641817507250
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `venue_content_markers` ADD `information_marker_1_name` varchar(255) AFTER `information_marker_1`',
    );
    await queryRunner.query(
      'ALTER TABLE `venue_content_markers` ADD `information_marker_2_name` varchar(255) AFTER `information_marker_2`',
    );
    await queryRunner.query(
      'ALTER TABLE `venue_content_markers` ADD `information_marker_3_name` varchar(255) AFTER `information_marker_3`',
    );
    await queryRunner.query(
      'ALTER TABLE `venue_content_markers` ADD `information_marker_4_name` varchar(255) AFTER `information_marker_4`',
    );
    await queryRunner.query(
      'ALTER TABLE `venue_content_markers` ADD `information_marker_5_name` varchar(255) AFTER `information_marker_5`',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `venue_content_markers` DROP COLUMN `information_marker_1_name` ',
    );
    await queryRunner.query(
      'ALTER TABLE `venue_content_markers` DROP COLUMN `information_marker_2_name` ',
    );
    await queryRunner.query(
      'ALTER TABLE `venue_content_markers` DROP COLUMN `information_marker_3_name` ',
    );
    await queryRunner.query(
      'ALTER TABLE `venue_content_markers` DROP COLUMN `information_marker_4_name` ',
    );
    await queryRunner.query(
      'ALTER TABLE `venue_content_markers` DROP COLUMN `information_marker_5_name` ',
    );
  }
}
