import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class createMarkerMediaTable1609150179545 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'marker_media',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'marker_id',
                        type: 'integer',
                        isNullable: true,
                    },
                    {
                        name: 'media_id',
                        type: 'integer',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'datetime',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updated_at',
                        type: 'datetime',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'deleted_at',
                        type: 'datetime',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        );

        await queryRunner.createForeignKey("marker_media", new TableForeignKey({
            columnNames: ["marker_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "markers",
            onDelete: "CASCADE"
        }));

        await queryRunner.createForeignKey("marker_media", new TableForeignKey({
            columnNames: ["media_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "media_gallery",
            onDelete: "CASCADE"
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {

        const table = await queryRunner.getTable("marker_media");

        const markerForeignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf("marker_id") !== -1);
        await queryRunner.dropForeignKey("marker_media", markerForeignKey);

        const mediaForeignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf("media_id") !== -1);
        await queryRunner.dropForeignKey("marker_media", mediaForeignKey);

        await queryRunner.dropTable('marker_media', true);

    }

}
