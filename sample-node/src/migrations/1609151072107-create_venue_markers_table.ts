import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class createVenueMarkersTable1609151072107 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'venue_markers',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'venue_id',
                        type: 'integer',
                        isNullable: true,
                    },
                    {
                        name: 'marker_id',
                        type: 'integer',
                        isNullable: true,

                    },
                    {
                        name: 'yaw',
                        type: 'varchar',
                        length: '191',
                        isNullable: true,

                    },
                    {
                        name: 'pitch',
                        type: 'varchar',
                        length: '191',
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

        await queryRunner.createForeignKey("venue_markers", new TableForeignKey({
            columnNames: ["venue_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "venues",
            onDelete: "CASCADE"
        }));

        await queryRunner.createForeignKey("venue_markers", new TableForeignKey({
            columnNames: ["marker_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "markers",
            onDelete: "CASCADE"
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {

        const table = await queryRunner.getTable("venue_markers");

        const venueForeignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf("venue_id") !== -1);
        await queryRunner.dropForeignKey("venue_markers", venueForeignKey);


        const markerForeignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf("marker_id") !== -1);
        await queryRunner.dropForeignKey("venue_markers", markerForeignKey);

        await queryRunner.dropTable('venue_markers', true);
    }

}
