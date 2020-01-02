load("//tools:defaults.bzl", "rollup_bundle", "ts_library")
load("@npm_bazel_karma//:index.bzl", "karma_web_test_suite")

def karma_test_prepare(name, env_srcs, env_deps, env_entry_point, test_srcs, test_deps, test_entry_point):
    ts_library(
        name = name + "_env",
        testonly = True,
        srcs = env_srcs,
        deps = env_deps,
    )
    rollup_bundle(
        name = name + "_env_rollup",
        testonly = True,
        sourcemap = "false",
        entry_point = env_entry_point,
        silent = True,
        deps = [
            ":" + name + "_env",
            "@npm//rollup-plugin-commonjs",
            "@npm//rollup-plugin-node-resolve",
        ],
    )
    ts_library(
        name = name + "_test",
        testonly = True,
        srcs = test_srcs,
        deps = test_deps,
    )
    rollup_bundle(
        name = name + "_rollup",
        testonly = True,
        silent = True,
        sourcemap = "false",
        entry_point = test_entry_point,
        config_file = "//packages/zone.js:rollup-es5.config.js",
        deps = [
            ":" + name + "_test",
            "@npm//rollup-plugin-commonjs",
            "@npm//rollup-plugin-node-resolve",
        ],
    )

def karma_test(name, env_srcs, env_deps, env_entry_point, test_srcs, test_deps, test_entry_point, bootstraps, ci):
    first = True
    for subname in bootstraps:
        bootstrap = bootstraps[subname]
        firstFlag = first
        if first:
            first = False
            karma_test_prepare(name, env_srcs, env_deps, env_entry_point, test_srcs, test_deps, test_entry_point)
        _karma_test_required_dist_files = [
            "//packages/zone.js/dist:task-tracking.js",
            "//packages/zone.js/dist:wtf.js",
            "//packages/zone.js/dist:webapis-notification.js",
            "//packages/zone.js/dist:webapis-media-query.js",
            "//packages/zone.js/dist:zone-patch-canvas.js",
            "//packages/zone.js/dist:zone-patch-fetch.js",
            "//packages/zone.js/dist:zone-patch-resize-observer.js",
            "//packages/zone.js/dist:zone-patch-user-media.js",
            "//packages/zone.js/dist:zone-patch-message-port.js",
            ":" + name + "_rollup.umd",
        ]

        karma_web_test_suite(
            name = subname + "_karma_jasmine_test",
            srcs = [
                "fake_entry.js",
            ],
            bootstrap = [
                            ":" + name + "_env_rollup.umd",
                        ] + bootstrap +
                        _karma_test_required_dist_files,
            browsers = ["//tools/browsers:chromium"],
            static_files = [
                ":assets/sample.json",
                ":assets/worker.js",
                ":assets/import.html",
            ],
            tags = ["zone_karma_test"],
            runtime_deps = [
                "@npm//karma-browserstack-launcher",
            ],
        )

        if ci and firstFlag:
            karma_web_test_suite(
                name = "karma_jasmine_test_ci",
                srcs = [
                    "fake_entry.js",
                ],
                bootstrap = [
                    ":saucelabs.js",
                    ":" + name + "_env_rollup.umd",
                    "//packages/zone.js/dist:zone-testing-bundle.min.js",
                ] + _karma_test_required_dist_files,
                browsers = ["//tools/browsers:chromium"],
                config_file = "//:karma-js.conf.js",
                configuration_env_vars = ["KARMA_WEB_TEST_MODE"],
                data = [
                    "//:browser-providers.conf.js",
                    "//tools:jasmine-seed-generator.js",
                ],
                static_files = [
                    ":assets/sample.json",
                    ":assets/worker.js",
                    ":assets/import.html",
                ],
                tags = ["zone_karma_test"],
                # Visible to //:saucelabs_unit_tests_poc target
                visibility = ["//:__pkg__"],
                runtime_deps = [
                    "@npm//karma-browserstack-launcher",
                ],
            )
