from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0008_cleanup_old_elderprofile_columns'),
        ('appointments', '0002_sync_appointment_schema'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                ALTER TABLE appointments_appointment
                DROP CONSTRAINT IF EXISTS appointments_appointment_elder_id_5ff72701_fk_accounts_user_id;

                ALTER TABLE appointments_appointment
                DROP CONSTRAINT IF EXISTS appointments_appointment_elder_id_fk_accounts_elderprofile_id;

                ALTER TABLE appointments_appointment
                ADD CONSTRAINT appointments_appointment_elder_id_fk_accounts_elderprofile_id
                FOREIGN KEY (elder_id)
                REFERENCES accounts_elderprofile(id)
                ON DELETE CASCADE
                DEFERRABLE INITIALLY DEFERRED;
            """,
            reverse_sql="""
                -- Reverse SQL
            """
        ),
    ]
