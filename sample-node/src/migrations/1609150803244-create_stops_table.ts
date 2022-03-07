import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class createStopsTable1609150803244 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'stops',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'user_id',
                        type: 'int',
                        isNullable: true,
                    },
                    {
                        name: 'paranoma_image_id',
                        type: 'int',
                        isNullable: true,

                    },
                    {
                        name: 'street_photo_id',
                        type: 'int',
                        isNullable: true,

                    },
                    {
                        name: 'render_data_id',
                        type: 'int',
                        isNullable: true,
                    },
                    {
                        name: 'wrap_video_id',
                        type: 'int',
                        isNullable: true,

                    },
                    {
                        name: 'name',
                        type: 'varchar',
                        length: '191',
                        isNullable: true,
                    },
                    {
                        name: 'description',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'latitude',
                        type: 'varchar',
                        length: '191',
                        isNullable: true,
                    },
                    {
                        name: 'longitude',
                        type: 'varchar',
                        length: '191',
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

        await queryRunner.createForeignKey("stops", new TableForeignKey({
            columnNames: ["user_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "users",
            onDelete: "CASCADE"
        }));

        await queryRunner.createForeignKey("stops", new TableForeignKey({
            columnNames: ["paranoma_image_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "media_gallery",
            onDelete: "CASCADE"
        }));

        await queryRunner.createForeignKey("stops", new TableForeignKey({
            columnNames: ["street_photo_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "media_gallery",
            onDelete: "CASCADE"
        }));

        await queryRunner.createForeignKey("stops", new TableForeignKey({
            columnNames: ["render_data_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "media_gallery",
            onDelete: "CASCADE"
        }));

        await queryRunner.createForeignKey("stops", new TableForeignKey({
            columnNames: ["wrap_video_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "media_gallery",
            onDelete: "CASCADE"
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {

        const table = await queryRunner.getTable("stops");

        const userForeignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf("user_id") !== -1);
        await queryRunner.dropForeignKey("stops", userForeignKey);

        const panaromaForeignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf("paranoma_image_id") !== -1);
        await queryRunner.dropForeignKey("stops", panaromaForeignKey);

        const streetForeignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf("street_photo_id") !== -1);
        await queryRunner.dropForeignKey("stops", streetForeignKey);

        const renderForeignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf("render_data_id") !== -1);
        await queryRunner.dropForeignKey("stops", renderForeignKey);

        const wrapForeignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf("wrap_video_id") !== -1);
        await queryRunner.dropForeignKey("stops", wrapForeignKey);

        await queryRunner.dropTable('stops', true);
    }

}
