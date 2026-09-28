from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0006_passwordresetotp"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                ALTER TABLE accounts_familyprofile
                DROP COLUMN IF EXISTS phone;

                ALTER TABLE accounts_familyprofile
                DROP COLUMN IF EXISTS relationship_default;

                ALTER TABLE accounts_familyprofile
                DROP COLUMN IF EXISTS bio;
            """,
            reverse_sql="""
                ALTER TABLE accounts_familyprofile
                ADD COLUMN phone VARCHAR(15) NOT NULL DEFAULT '';

                ALTER TABLE accounts_familyprofile
                ADD COLUMN relationship_default VARCHAR(50) NOT NULL DEFAULT '';

                ALTER TABLE accounts_familyprofile
                ADD COLUMN bio TEXT NOT NULL DEFAULT '';
            """,
        ),
    ]