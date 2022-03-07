import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class stopVenues1609149893093 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'stop_venues',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'stop_id',
                        type: 'integer',
                        isNullable: true,
                    },
                    {
                        name: 'venue_id',
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

        await queryRunner.createForeignKey("stop_venues", new TableForeignKey({
            columnNames: ["stop_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "stops",
            onDelete: "CASCADE"
        }));

        await queryRunner.createForeignKey("stop_venues", new TableForeignKey({
            columnNames: ["venue_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "venues",
            onDelete: "CASCADE"
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("stop_venues");

        const venueForeignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf("venue_id") !== -1);
        await queryRunner.dropForeignKey("stop_venues", venueForeignKey);

        const stopForeignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf("stop_id") !== -1);
        await queryRunner.dropForeignKey("stop_venues", stopForeignKey);

        await queryRunner.dropTable('stop_venues', true);
    }

}
