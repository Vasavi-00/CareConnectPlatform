from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0008_cleanup_old_elderprofile_columns'),
        ('medicines', '0003_alter_medicine_options_alter_medicine_elder_and_more'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AddField(
                    model_name='medicine',
                    name='timing',
                    field=models.CharField(blank=True, default='', max_length=100),
                ),
                migrations.AddField(
                    model_name='medicine',
                    name='prescribed_by',
                    field=models.CharField(blank=True, default='', max_length=150),
                ),
                migrations.AddField(
                    model_name='medicine',
                    name='refill_threshold',
                    field=models.PositiveIntegerField(default=5),
                ),
                migrations.AlterField(
                    model_name='medicine',
                    name='frequency',
                    field=models.CharField(default='Once daily', max_length=100),
                ),
                migrations.AlterField(
                    model_name='medicine',
                    name='food_timing',
                    field=models.CharField(blank=True, default='ANY', max_length=10),
                ),
                migrations.AlterField(
                    model_name='medicine',
                    name='start_date',
                    field=models.DateField(blank=True, null=True),
                ),
                migrations.AlterField(
                    model_name='medicine',
                    name='elder',
                    field=models.ForeignKey(
                        db_column='elder_id',
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='medicines',
                        to='accounts.elderprofile',
                    ),
                ),
            ],
            database_operations=[
                migrations.RunSQL(
                    sql="""
                        ALTER TABLE medicines_medicine
                        ADD COLUMN IF NOT EXISTS timing VARCHAR(100) NOT NULL DEFAULT '';

                        ALTER TABLE medicines_medicine
                        ADD COLUMN IF NOT EXISTS prescribed_by VARCHAR(150) NOT NULL DEFAULT '';

                        ALTER TABLE medicines_medicine
                        ADD COLUMN IF NOT EXISTS refill_threshold INTEGER NOT NULL DEFAULT 5;

                        ALTER TABLE medicines_medicine
                        ALTER COLUMN timing SET DEFAULT '';

                        ALTER TABLE medicines_medicine
                        ALTER COLUMN prescribed_by SET DEFAULT '';

                        ALTER TABLE medicines_medicine
                        ALTER COLUMN refill_threshold SET DEFAULT 5;

                        ALTER TABLE medicines_medicine
                        ALTER COLUMN start_date DROP NOT NULL;

                        ALTER TABLE medicines_medicine
                        ALTER COLUMN frequency TYPE VARCHAR(100);

                        ALTER TABLE medicines_medicine
                        DROP CONSTRAINT IF EXISTS medicines_medicine_elder_id_ca3244a7_fk_accounts_user_id;

                        ALTER TABLE medicines_medicine
                        DROP CONSTRAINT IF EXISTS medicines_medicine_elder_id_fk_accounts_elderprofile_id;

                        ALTER TABLE medicines_medicine
                        ADD CONSTRAINT medicines_medicine_elder_id_fk_accounts_elderprofile_id
                        FOREIGN KEY (elder_id)
                        REFERENCES accounts_elderprofile(id)
                        ON DELETE CASCADE
                        DEFERRABLE INITIALLY DEFERRED;
                    """,
                    reverse_sql="""
                        -- Reverse SQL preserves constraints safely
                    """
                ),
            ]
        ),
    ]
