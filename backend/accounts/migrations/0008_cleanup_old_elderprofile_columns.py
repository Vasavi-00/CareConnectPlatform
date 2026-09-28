from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0007_cleanup_old_familyprofile_columns"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                ALTER TABLE accounts_elderprofile
                DROP COLUMN IF EXISTS blood_group;
            """,
            reverse_sql="""
                ALTER TABLE accounts_elderprofile
                ADD COLUMN blood_group VARCHAR(20) NOT NULL DEFAULT '';
            """,
        ),
    ]